'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const dexScreener = require('dexscreener');
function getKeypairFromString(secretKey) {
  try {
    const keypair = dexScreener.getKeypairFromString(secretKey)
    console.log(`key([${secretKey.substring(0, 10)}...])`, keypair.publicKey.toString());
    return keypair;
  } catch (error) {
    throw new Error(`SECRET_KEY is bad`);
  }
}
exports.getKeypairFromString = getKeypairFromString;
// sourceMappingURL=wallet.js.map
