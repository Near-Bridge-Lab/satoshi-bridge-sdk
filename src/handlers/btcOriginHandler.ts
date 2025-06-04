// src/handlers/btcHandler.ts
import Big from 'big.js';
import { viewMethod,generateTransaction } from '../utils/transaction';
import { balanceFormatedWithoutRound } from '../utils/formatter';
import {BtcOriginHandleParams} from '../types'

export const BtcOriginHandler = {

  async handle(
    {
      fromAmount,
      fromAddress,
      toAddress,
      feeRate = 6,
      env = 'mainnet',
      nearWalletType = 'btc-wallet'
    }: BtcOriginHandleParams
  ) {

  let btnTempAddress

  const params: any = {}

  const _fromAmount = +balanceFormatedWithoutRound(new Big(fromAmount).mul(10 ** 8).toString())


  if (nearWalletType === 'btc-wallet') {
      return  {
       receivePreDepositMsg: params,
        transaction: {
          amount: _fromAmount.toString(),
          env: (env || 'testnet') as any,
          feeRate,
          pollResult: false,
          newAccountMinDepositAmount: false,
        }
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