import { Token } from '../../types/custom';
export declare class DexScreener {
    tokenA: Token;
    tokenB: Token;
    constructor(tokenA: Token, tokenB: Token);
    getLiquidityPoolData(dexId: string): Promise<any>;
}
