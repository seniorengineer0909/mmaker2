'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const fs_1 = __importDefault(require('fs'));
const bs58_1 = __importDefault(require('bs58'));
const web3_js_1 = require('@solana/web3.js');
const web3_js_2 = require('@solana/web3.js');
const dexscreener = require('dexscreener');
/**
 * Setup connection to Solana RPC endpoint
 * @param {string} endpoint - RPC endpoint
 * @returns {Connection} - Connection object
 */
function setupSolanaConnection(rpcEndPoint, socketEndPoint) {
  return new web3_js_2.Connection(rpcEndPoint, {
    wsEndpoint: socketEndPoint,
  });
}
exports.setupSolanaConnection = setupSolanaConnection;
//# sourceMappingURL=solana.js.map
