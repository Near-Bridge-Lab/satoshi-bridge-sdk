// src/types.ts
  
  //
  export interface BtcHandler {
    handle(params: BtcHandleParams): Promise<string | null>;
    estimateGas(amount: string | number): Promise<EstimateGasResultBTC>;
  }
  
  export interface NearHandler {
    handle(params: NearHandleParams): Promise<{signature?: string, hash?: string} | null>;
    estimateGas(amount: string | number, btcAddress: string): Promise<EstimateGasResultNear>;
  }
  
  export interface BtcOriginHandler {
    handle(params: BtcOriginHandleParams): Promise<string | null>;
  }
  
  export interface NearOriginHandler {
    handle(params: NearOriginHandleParams): Promise<string | null>;
  }
  
  //
  export interface BtcHandleParams {
    fromAmount: string | number;
    fromAddress: string;
    toAddress: string;
    tokenOutMetaData: {
      address: string;
      decimals: number;
    };
    nearWalletType: 'btc-wallet' | 'near-wallet';
    slippage?: number;
    feeRate?: number;
    env?: string;
  }
  
  export interface NearHandleParams {
      fromAmount: string;
      fromAddress: string;
      toAddress: string;
      walletId: string;
      tokenInMetaData: {
          address: string;
          decimals: number;
      },
      slippage?: number;
      feeRate?: number;
      env?: string;
  }
  
  export interface BtcOriginHandleParams {
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
    nearWalletType: 'btc-wallet' | 'near-wallet';
    feeRate?: number;
    env?: string;
  }
  
  export interface NearOriginHandleParams {
        fromAmount: string;
        fromAddress: string;
        toAddress: string;
        walletId: string;
        feeRate?: number;
        env?: string;
  }
  
export interface EstimateGasResultBTC {
    networkFee: number | string;
    fee: number | string,
    realAmount: number | string,
    receiveAmount: number | string,
    isSuccess: boolean,
}

export interface EstimateGasResultNear {
  gasFee: number;
  withdrawFee: number;
  isError: boolean;
  errorMsg: string;
  receiveAmount: string;
  utxosInput: any[];
  inputs: any[];
  outputs: any[];
  withdrawFeeOrigin: number | string;
  gasMore: number | string;
  fromAmount: number | string;
}


export interface EstimateGasResultBTCErr {
  isError: boolean;
  errorMsg: string;
}

export interface EstimateGasResultNearErr {
  withdrawFee: number;
  isError: boolean;
  errorMsg: string;
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


  export interface NearHandleResp {
      receiverId: string;
      actions: [
          {
              type: string;
              params: {
                  methodName: string;
                  args: {
                      receiver_id: string;
                      amount: string;
                      msg: string;
                  },
                  gas: string;
                  deposit: string;
              },
          }
      ]
  }


export interface  NearOriginHandleResp {
      receiverId: string;
      actions: [
          {
              type: string;
              params: {
                  methodName: string;
                  args: {
                      receiver_id: string;
                      amount: string;
                      msg: string;
                  },
                  gas: string;
                  deposit: string;
              },
          },
      ],
  }


export interface RepParams {
    receivePreDepositMsg: {};
    transaction: {
      amount: string;
      env: 'mainnet' | 'testnet';
      feeRate: number | string;
      pollResult: boolean;
      newAccountMinDepositAmount: boolean;
  }
} 

export interface RepParamsNotBtc {
  receivePreDepositMsg:  {
      nearAddress: string;
      depositType: number;
  };
  transaction: {
      btnTempAddress: string;
      _fromAmount: string;
      feeRate: number;
  }
}

export interface ContractRep {
  receivePreDepositMsg: {};
  transaction: {
    amount: string;
    env: 'mainnet' | 'testnet';
    feeRate: string | number;
    pollResult: boolean;
    newAccountMinDepositAmount: boolean;
    action: {
        receiver_id: string;
        amount: string;
        msg: string;
    };
    registerContractId?: string;
  }
}


export interface EstimateBtcGasParams {
  fromAmount: string | number;
  feeRate: number;
  account: string;
  toAddress: string;
  env: 'mainnet' | 'testnet';
  tokenOutMetaData: {
    address: string;
    decimals: number;
  };
  useDecimals?: boolean;
  isCustomToken?: boolean;
  slippage?: number;
}


export interface EstimateNearGasParams {
  _satoshis: string | number;
    fromAddress: string;
    toAddress: string; 
    walletType: string; 
    tokenInMetaData: {
        address: string;
        decimals: number;
    };
    isCustomToken?: boolean; 
    feeRate?: number; 
    env?: string; 
    useDecimals?: boolean;
    slippage?: number;
}