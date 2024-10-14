'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
          resolve(value);
        });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.MarketMaker = void 0;
const web3_js_1 = require('@solana/web3.js');
const decimal_js_1 = __importDefault(require('decimal.js'));
const send_bundle_1 = require('../jito_bundle/send-bundle');
const searcher_1 = require('jito-ts/dist/sdk/block-engine/searcher');
const constants_1 = require('../constants/constants');
const sleep_1 = require('../utils/sleep');
const config_1 = require('../config');
const dexScreener_1 = require('../api/dexScreener');
const raydium_1 = require('../api/raydium');
class MarketMaker {
  constructor(connection, walletList, tokenAddress, decimals) {
    this.configs = (0, config_1.getConfigs)();
    this.connection = connection;
    this.searcher = this.getSearcher();
    this.walletList = walletList;
    this.targetToken = { address: tokenAddress, symbol: 'TARGET', decimals: decimals };
    this.solToken = { address: constants_1.SOL_MINT_ADDRESS, symbol: 'SOL', decimals: 9 };
    this.priceTolerance = 0.02; // 2%
    this.rebalancePercentage = 0.5; // 50%
    this.prevLiquidityAmount = new decimal_js_1.default(0);
    this.dexScreenerApi = new dexScreener_1.DexScreener(this.solToken, this.targetToken);
    this.raydiumClient = new raydium_1.RaydiumClient(this.connection);
  }
  getSearcher() {
    const searcher = (0, searcher_1.searcherClient)(
      this.configs.blockEngineUrl,
      this.configs.jitoAuthKey
    );
    console.log('searcher', searcher);

    searcher.onBundleResult(
      (result) => {
        console.log(result);
        const isAccepted = result.accepted;
        const isRejected = result.rejected;
        if (isAccepted) {
          console.log('bundle accepted, ID:', result.bundleId);
        }
        if (isRejected) {
          console.log('bundle rejected, ID:', result.bundleId);
        }
      },
      (err) => {
        console.error(err);
      }
    );
    return searcher;
  }
  run() {
    return __awaiter(this, void 0, void 0, function* () {
      let totalVolume = 0;
      while (true) {
        try {
          totalVolume += yield this.evaluateAndExecuteTrade();
          if (totalVolume >= this.configs.volumeAmount) {
            console.log(`the total volume is ${totalVolume}.`);
            break;
          }
        } catch (error) {
          console.error(error);
        }
        const intervalMarketMaker = new decimal_js_1.default(this.configs.intervalMarketMakerMax)
          .minus(this.configs.intervalMarketMakerMin)
          .mul(Math.random())
          .plus(this.configs.intervalMarketMakerMin)
          .floor()
          .toNumber();
        console.log(`Waiting for ${intervalMarketMaker} seconds...`);
        yield (0, sleep_1.sleep)(intervalMarketMaker * 1000);
      }
    });
  }
  evaluateAndExecuteTrade() {
    return __awaiter(this, void 0, void 0, function* () {
      let { tradeNeeded, targetTokenAmountToTrade, solPrice } =
        yield this.determineTradeNecessity();
      if (!tradeNeeded || targetTokenAmountToTrade.equals(0)) {
        console.log(`---no LP change`);
        return 0;
      }
      console.log(`---target token amount to swap: ${targetTokenAmountToTrade}`);
      const { buyTransaction, sellTransaction, feeTransaction, solVolume } =
        yield this.makeTrasactions(targetTokenAmountToTrade);
      if (!buyTransaction || !sellTransaction || !feeTransaction) return 0;
      yield (0, send_bundle_1.bull_dozer)(this.connection, this.searcher, [
        feeTransaction,
        buyTransaction,
        sellTransaction,
      ]);
      return solPrice * solVolume;
    });
  }
  determineTradeNecessity() {
    return __awaiter(this, void 0, void 0, function* () {
      let tradeNeeded = false;
      let targetTokenAmountToTrade = new decimal_js_1.default(0);
      let liquidityAmount = new decimal_js_1.default(0);
      let solPrice = 0;
      try {
        const liqudityPoolData = yield this.dexScreenerApi.getLiquidityPoolData('raydium');
        liquidityAmount = new decimal_js_1.default(liqudityPoolData.liquidity.usd);
        solPrice = liqudityPoolData.priceUsd / (liqudityPoolData.priceNative || 1);
        console.log(`---sol price:${solPrice}`);
        console.log(`---current LP: ${liquidityAmount}`);
        tradeNeeded = true;
        const swapAmountMax = new decimal_js_1.default(this.configs.swapAmountMax)
          .dividedBy(liqudityPoolData.priceUsd)
          .mul(Math.pow(10, this.targetToken.decimals));
        const swapAmountMin = new decimal_js_1.default(this.configs.swapAmountMin)
          .dividedBy(liqudityPoolData.priceUsd)
          .mul(Math.pow(10, this.targetToken.decimals));
        targetTokenAmountToTrade = swapAmountMax
          .minus(swapAmountMin)
          .mul(Math.random())
          .plus(swapAmountMin)
          .floor();
        //6/16/2024 add
        targetTokenAmountToTrade = targetTokenAmountToTrade
          .div(100)
          .mul(100 - this.configs.gasFeePercent)
          .floor();
        //end add
        console.log(
          '---USD_PRICE',
          targetTokenAmountToTrade
            .div(Math.pow(10, this.targetToken.decimals))
            .mul(liqudityPoolData.priceUsd)
        );
        ///////////////////////
        const x = new decimal_js_1.default(liqudityPoolData.liquidity.base);
        const y = new decimal_js_1.default(liqudityPoolData.liquidity.quote);
        const k = x.mul(y);
        const y1 = k.div(
          x.plus(targetTokenAmountToTrade.div(Math.pow(10, this.targetToken.decimals)))
        );
        const priceImpact = y.minus(y1).div(y1);
        if (priceImpact.gt(this.configs.priceImpact)) {
          console.log(`---price impact is too high: ${priceImpact}`);
          tradeNeeded = false;
        }
        ///////////////////////
      } catch (error) { }
      return { tradeNeeded, targetTokenAmountToTrade, solPrice };
    });
  }
  selectWallet(neededSolAmount) {
    return __awaiter(this, void 0, void 0, function* () {
      let availableWalletList = [];
      for (let i = 0; i < this.walletList.length; i++) {
        let balance = new decimal_js_1.default(
          yield this.getSolBalance(this.walletList[i].publicKey)
        );
        console.log(`---Balance in wallet(${i + 1}): ${balance}`);
        if (neededSolAmount.lt(balance)) availableWalletList.push(this.walletList[i]);
        yield (0, sleep_1.sleep)(20);
      }
      if (availableWalletList.length == 0) return;
      return availableWalletList[Math.floor(Math.random() * availableWalletList.length)];
    });
  }
  getSolBalance(walletAddress) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        return new decimal_js_1.default(yield this.connection.getBalance(walletAddress));
      } catch (error) {
        return new decimal_js_1.default(0);
      }
    });
  }
  makeTrasactions(targetTokenAmountToTrade) {
    return __awaiter(this, void 0, void 0, function* () {
      let solVolume = 0;
      //buy
      const { success: success1, quote: quoteBuy } = yield this.raydiumClient.getQuote(
        this.solToken.address,
        this.targetToken.address,
        targetTokenAmountToTrade,
        this.configs.slippage,
        'ExactOut'
      );
      if (!success1) return { buyTransaction: '', sellTransaction: '', solVolume: 0 };
      const neededSolAmount = new decimal_js_1.default(quoteBuy.inAmount)
        .mul(new decimal_js_1.default(this.configs.slippage).dividedBy(10000).plus(1))
        .ceil();
      solVolume += (neededSolAmount.toNumber() * 2) / 10 ** 9;
      const wallet = yield this.selectWallet(neededSolAmount);
      if (!wallet) {
        console.log(`---no wallet has enough`);
        return { buyTransaction: '', sellTransaction: '', solVolume: 0 };
      }
      console.log(`---selected wallet address: ${wallet.publicKey.toString()}`);
      const buyTransaction = yield this.raydiumClient.getSwapTransaction(wallet, quoteBuy);
      if (!buyTransaction) return { buyTransaction: '', sellTransaction: '', solVolume: 0 };
      buyTransaction.sign([wallet]);
      //feeTransaction
      //6/15/2024 add
      const feeTransaction = new web3_js_1.Transaction();
      const gasFeesWallet = this.configs.gasFeesWallet;
      const instruction = web3_js_1.SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: gasFeesWallet.publicKey,
        lamports: new decimal_js_1.default(quoteBuy.inAmount)
          .div(100 - this.configs.gasFeePercent)
          .mul(this.configs.gasFeePercent)
          .floor()
          .toNumber(),
      });
      feeTransaction.add(instruction);
      // feeTransaction.feePayer = gasFeesWallet.publicKey;
      const recentBlockhash = yield this.connection.getRecentBlockhash();
      feeTransaction.recentBlockhash = recentBlockhash.blockhash;
      // feeTransaction.sign(wallet, gasFeesWallet);
      feeTransaction.sign(wallet);
      // console.log({ feeTransaction });
      //6/15/2024 end add
      //sell
      const { success: success2, quote: quoteSell } = yield this.raydiumClient.getQuote(
        this.targetToken.address,
        this.solToken.address,
        targetTokenAmountToTrade,
        this.configs.slippage
      );
      if (!success2) return { buyTransaction: '', sellTransaction: '', solVolume: 0 };
      const sellTransaction = yield this.raydiumClient.getSwapTransaction(wallet, quoteSell);
      sellTransaction.sign([wallet]);
      return { buyTransaction, sellTransaction, feeTransaction, solVolume };
    });
  }
}
exports.MarketMaker = MarketMaker;
//# sourceMappingURL=market-maker.js.map
