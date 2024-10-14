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
const dotenv_1 = __importDefault(require('dotenv'));
const solana_1 = require('./api/solana');
const dexscreener = require('dexscreener');
const market_maker_1 = require('./mode/market-maker');
const trendTrade_1 = require('./mode/trendTrade');
const both_1 = require('./mode/both');
const wallet_1 = require('./utils/wallet');
const getDecimal_1 = require('./utils/getDecimal');
const sleep_1 = require('./utils/sleep');
const config_1 = require('./config');
const express_1 = __importDefault(require('express'));
const app = (0, express_1.default)();

app.get('/', (req, res) => {
  res.send('The MM bot is running.');
});
app.listen(process.env.PORT, () => {
  console.log('Example app listening on port 3000!');
});
function main() {
  return __awaiter(this, void 0, void 0, function* () {
    dotenv_1.default.config();
    console.log('checking env values ...');
    const config = (0, config_1.getConfigs)();
    console.log('initializing ...');
    console.log('wallet setting ...');
    if (!process.env.WALLET_SECRET_KEY) {
      throw new Error(`WALLET_SECRET_KEY is not set.`);
    }
    const walletList = process.env.WALLET_SECRET_KEY.split('-').map((e) => {
      return (0, wallet_1.getKeypairFromString)(new String(e));
    });
    console.log('network setting ...');
    const connection = (0, solana_1.setupSolanaConnection)(
      process.env.SOLANA_RPC_ENDPOINT,
      process.env.RPC_WEBSOCKET_ENDPOINT
    );
    console.log('token setting ...');
    for (const tokenAddress of config.tokenAddresses) {
      run(tokenAddress, connection, walletList, config);
      yield (0, sleep_1.sleep)(config.intervalTradeTrend * 500);
    }
  });
}

async function run(tokenAddress, connection, walletList, config) {
  console.log("start token", tokenAddress)
  let decimals = 0;
  while (!decimals) {
    decimals = await (0, getDecimal_1.getDecimal)(connection, tokenAddress);
    if (decimals) break;
    console.log('failed to get token info. retrying...');
    (0, sleep_1.sleep)(1000);
  }
  const mode = config.workMord;
  if (mode == 'mm') {
    const marketMaker = new market_maker_1.MarketMaker(connection, walletList, tokenAddress, decimals); // to do calculate token decim
    await marketMaker.run();
  } else if (mode == 'trend') {
    const trendBot = new trendTrade_1.TrendTrade(connection, walletList, tokenAddress, decimals);
    trendBot.run();
    return;
  } else if (mode == 'both') {
    const both = new both_1.Both(connection, walletList, decimals);
    both.run();
    return;
  } else {
    console.log('configure right work mode please.');
    return;
  }
}

main().catch((err) => console.error(err));
//# sourceMappingURL=main.js.map
