// src/types.ts
export interface BridgeConfig {
    // 核心配置
    contractId: string;
    nbtcToken: string;
    abtcToken: string;
    proxyContract?: string;
    
    // 网络配置
    nearNetwork: 'mainnet' | 'testnet';
    btcNetwork: 'mainnet' | 'testnet';
    
    // API 端点
    baseUrl: string;
    
    // 回调函数
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    onTransaction?: (txHash: string) => void;
  }
  
  export interface BridgeSDK {
    btc: BtcHandler;
    near: NearHandler;
    btcOrigin: BtcOriginHandler;
    nearOrigin: NearOriginHandler;
  }
  
  // 处理程序接口
  export interface BtcHandler {
    handle(params: BtcHandleParams): Promise<string | null>;
    estimateGas(amount: string | number): Promise<EstimateGasResult>;
  }
  
  export interface NearHandler {
    handle(params: NearHandleParams): Promise<{signature?: string, hash?: string} | null>;
    estimateGas(amount: string | number, btcAddress: string): Promise<EstimateGasResult>;
  }
  
  export interface BtcOriginHandler {
    handle(params: BtcOriginHandleParams): Promise<string | null>;
  }
  
  export interface NearOriginHandler {
    handle(params: NearOriginHandleParams): Promise<string | null>;
  }
  
  // 参数接口
  export interface BtcHandleParams {
    fromAmount: string | number;
    nearAccount: string;
    action?: any;
    needSaveNBTC?: any;
    estimateResult?: any;
    baseRegisterTransaction?: any;
  }
  
  export interface NearHandleParams {
    fromAmount: string | number;
    btcAddress: string;
    selectedToken?: string;
  }
  
  export interface BtcOriginHandleParams {
    fromAmount: string | number;
    nearAccount: string;
  }
  
  export interface NearOriginHandleParams {
    fromAmount: string | number;
    btcAddress: string;
  }
  
  export interface EstimateGasResult {
    gasFee: number;
    withdrawFee?: number;
    isError?: boolean;
    errorMsg?: string;
    receiveAmount?: string;
    realAmount?: string;
    utxosInput?: any[];
  }



export interface QuerySwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    pathDeep?: number;
    slippage?: number;
    routerCount?: number;
    tokenInDecimals?: number;
    tokenOutDecimals?: number;
  }

  export interface NearQuerySwapResponse {
    routes: {
      pools: {
        pool_id: string;
        token_in: string;
        token_out: string;
        amount_in: string;
        amount_out: string;
        min_amount_out: string;
      }[];
      amount_in: string;
      min_amount_out: string;
      amount_out: string;
    }[];
    contract_in: string;
    contract_out: string;
    amount_in: string;
    amount_out: string;
  }