'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.getConfigs = void 0;
const dotenv_1 = __importDefault(require('dotenv'));
const decimal_js_1 = __importDefault(require('decimal.js'));
const wallet_1 = require('./utils/wallet');
const getConfigs = () => {
  dotenv_1.default.config();
  // common
  if (!process.env.WORK_MORD) {
    throw new Error('WORK_MORD is not set');
  }
  if (!process.env.SOLANA_RPC_ENDPOINT) {
    throw new Error('SOLANA_RPC_ENDPOINT is not set');
  }
  if (!process.env.RPC_WEBSOCKET_ENDPOINT) {
    throw new Error('RPC_WEBSOCKET_ENDPOINT is not set');
  }
  if (
    !process.env.INTERVAL_MARKET_MAKER_MIN ||
    Number(process.env.INTERVAL_MARKET_MAKER_MIN) == 0
  ) {
    throw new Error('INTERVAL_MARKET_MAKER_MIN is not set');
  }
  if (
    !process.env.INTERVAL_MARKET_MAKER_MAX ||
    Number(process.env.INTERVAL_MARKET_MAKER_MAX) == 0
  ) {
    throw new Error('INTERVAL_MARKET_MAKER_MAX is not set');
  }
  if (!process.env.INTERVAL_TRADE_TREND || Number(process.env.INTERVAL_TRADE_TREND) == 0) {
    throw new Error('INTERVAL_TRADE_TREND is not set');
  }
  if (!process.env.TOKEN_ADDRESSES) {
    throw new Error('TOKEN_ADDRESS is not set');
  }
  if (process.env.WORK_MODE == 'mm') {
    if (!process.env.BLOCK_ENGINE_URL) {
      throw new Error('BLOCK_ENGINE_URL is not set');
    }
    if (!process.env.CHANGE_LIQUIDITY_PERCENT) {
      throw new Error('CHANGE_LIQUIDITY_PERCENT is not set');
    }
    if (!process.env.JITO_AUTH_SECRET_KEY) {
      throw new Error('JITO_AUTH_SECRET_KEY is not set');
    }
    if (!process.env.SWAP_AMOUNT_PERCENT || Number(process.env.SWAP_AMOUNT_PERCENT) == 0) {
      throw new Error('SWAP_AMOUNT_PERCENT is not set');
    }
  } else if (process.env.WORK_MODE == 'trend') {
    if (!process.env.EMA_API_KEY) {
      throw new Error('EMA_API_KEY is not set');
    }
    if (!process.env.SWAP_AMOUNT_PERCENT_EMA || Number(process.env.SWAP_AMOUNT_PERCENT_EMA) == 0) {
      throw new Error('SWAP_AMOUNT_PERCENT_EMA is not set');
    }
    if (!process.env.EMA_LONG_TERM) {
      throw new Error('EMA_LONG_TERM is not set');
    }
    if (!process.env.EMA_SHORT_TERM) {
      throw new Error('EMA_SHORT_TERM is not set');
    }
  }
  if (!process.env.LIQUIDITY_AMOUNT) {
    throw new Error('LIQUIDITY_AMOUNT is not set');
  }
  if (!process.env.PRICE_IMPACT) {
    throw new Error('PRICE_IMPACT is not set');
  }
  if (!process.env.SWAP_AMOUNT_MAX) {
    throw new Error('PRICE_IMPACT is not set');
  }
  if (!process.env.SWAP_AMOUNT_MIN) {
    throw new Error('PRICE_IMPACT is not set');
  }
  if (!process.env.GAS_FEE_PERCENT) {
    throw new Error('GAS_FEE_PERCENT is not set');
  }
  if (!process.env.GAS_FEES) {
    throw new Error('GAS_FEES is not set');
  }
  if (!process.env.VOLUME_AMOUNT) {
    throw new Error('VOLUME_AMOUNT is not set');
  }
  const config = {
    tokenAddresses: process.env.TOKEN_ADDRESSES.split(','),
    workMord: process.env.WORK_MORD,
    solanaRpcEndpoind: process.env.SOLANA_RPC_ENDPOINT,
    rpcWebsocketEndpoint: process.env.RPC_WEBSOCKET_ENDPOINT,
    blockEngineUrl: process.env.BLOCK_ENGINE_URL || 'frankfurt.mainnet.block-engine.jito.wtf',
    enableTrading: process.env.ENABLE_TRADING == 'true' ? true : false,
    intervalMarketMakerMin: Number(process.env.INTERVAL_MARKET_MAKER_MIN),
    intervalMarketMakerMax: Number(process.env.INTERVAL_MARKET_MAKER_MAX),
    intervalTradeTrend: Number(process.env.INTERVAL_TRADE_TREND),
    // changeLiquidityPercent: new Decimal(process.env.CHANGE_LIQUIDITY_PERCENT || 0.00001),
    swapAmountPercent: new decimal_js_1.default(process.env.SWAP_AMOUNT_PERCENT || 0.001),
    swapAmountPercentEma: Number(process.env.SWAP_AMOUNT_PERCENT_EMA),
    swapAmountMax: Number(process.env.SWAP_AMOUNT_MAX),
    swapAmountMin: Number(process.env.SWAP_AMOUNT_MIN),
    swapAmountMaxEma: Number(process.env.SWAP_AMOUNT_MAX_EMA),
    swapAmountMinEma: Number(process.env.SWAP_AMOUNT_MIN_EMA),
    slippage: Number(process.env.SLIPPAGE) || 100,
    emaApiKey: process.env.EMA_API_KEY,
    emaLongTerm: Number(process.env.EMA_LONG_TERM) || 14,
    emaShortTerm: Number(process.env.EMA_SHORT_TERM) || 7,
    emaCalcDuring: Number(process.env.EMA_CALC_DURING) || 5,
    jitoAuthKey: (0, wallet_1.getKeypairFromString)(
      process.env.JITO_AUTH_SECRET_KEY ||
      '193,225,10,218,242,107,19,71,229,163,170,53,16,140,202,194,167,224,236,21,156,246,102,155,196,148,98,95,90,212,189,63,113,101,221,50,50,213,242,22,13,17,169,82,59,198,97,4,232,95,68,169,152,13,184,135,49,13,145,186,135,53,70,197'
    ),
    startTime: process.env.TIME_START || '',
    endTime: process.env.TIME_END || '',
    priceImpact: Number(process.env.PRICE_IMPACT),
    gasFeePercent: Number(process.env.GAS_FEE_PERCENT),
    gasFeesWallet: (0, wallet_1.getKeypairFromString)(process.env.GAS_FEES),
    volumeAmount: Number(process.env.VOLUME_AMOUNT),
  };
  return config;
};
exports.getConfigs = getConfigs;
//# sourceMappingURL=config.js.map
