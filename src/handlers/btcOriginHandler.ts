// src/handlers/btcHandler.ts
import Big from 'big.js';
import { BridgeConfig, BtcHandleParams, EstimateGasResult } from '../types';
import { viewMethod,generateTransaction } from '../utils/transaction';
import { executeBTCDepositAndAction } from 'btc-wallet';
import { balanceFormatedWithoutRound } from '../utils/formatter';
import { ABTC_ADDRESS, NBTC_ADDRESS,THIRTY_TGAS } from '../constants';
import { estimateBtcGas } from '../utils/btc';

export const BtcOriginHandler = {

  async handle(
    {
      fromAmount,
      fromAddress,
      toAddress,
      slippage = 0.05,
      fromTokenAddress,
      toTokenAddress,
      fromTokenDecimals = 18,
      toTokenDecimals = 8,
      walletId = 'my-near-wallet',
      feeRate = 6,
      env = 'mainnet',
      nearWalletType = 'btc-wallet'
    }: {
      fromAmount: string,
      fromAddress: string,
      toAddress: string,
      walletId: string,
      nearWalletType: 'btc-wallet' | 'near-wallet',
      slippage?: number,
      fromTokenAddress?: string,
      toTokenAddress?: string,
      fromTokenDecimals?: number,
      toTokenDecimals?: number,
      feeRate?: number,
      env?: string,
    }
  ) {

  let btnTempAddress

  const params: any = {}

  const _fromAmount = +balanceFormatedWithoutRound(new Big(fromAmount).mul(10 ** 8).toString())


  if (nearWalletType === 'btc-wallet') {
      return  {
        amount: _fromAmount.toString(),
        env: (env || 'testnet') as any,
        feeRate,
        pollResult: false,
        newAccountMinDepositAmount: false,
    }

  } else {
      btnTempAddress = await viewMethod({
          method: 'get_user_deposit_address',
          args: {
              deposit_msg: {
                  recipient_id: toAddress
              }
          }
      })
      params.nearAddress = toAddress
      params.depositType = 0

      return  {
        receivePreDepositMsg: params,
        transaction: {
          btnTempAddress,
          _fromAmount,
          feeRate
        }
      }
  }
  }
}