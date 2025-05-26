// src/handlers/btcHandler.ts
import Big from 'big.js';
import { viewMethod,generateTransaction } from '../utils/transaction';
import { balanceFormatedWithoutRound } from '../utils/formatter';
import { ABTC_ADDRESS, NBTC_ADDRESS,THIRTY_TGAS } from '../constants';
import { estimateBtcGas } from '../utils/btc';
import { registerToken } from '../utils/transaction';
import { getBalance } from '../utils/transaction';

export const BtcHandler = {

  async handle(
    {
      fromAmount,
      fromAddress,
      toAddress,
      slippage = 0.05,
      feeRate = 6,
      env = 'mainnet',
      nearWalletType = 'btc-wallet',
    }: {
      fromAmount: string,
      fromAddress: string,
      toAddress: string,
      nearWalletType: 'btc-wallet' | 'near-wallet',
      slippage?: number,
      feeRate?: number,
      env?: string,
    }
  ) {

  let btnTempAddress

  const params: any = {}
  const _fromAmount = +balanceFormatedWithoutRound(new Big(fromAmount).mul(10 ** 8).toString())
  const nbtcBalance = await getBalance(fromAddress,  env === 'testnet' ? 'nbtc.toalice.near' : NBTC_ADDRESS, env)
  const needSaveNBTC = new Big(800).div(10 ** 8).minus(nbtcBalance)
  console.log('nbtcBalance:', nbtcBalance, needSaveNBTC)
  const estimateResult = await estimateBtcGas({
      fromAmount:new Big(fromAmount).mul(10 ** 8).toNumber(), 
      feeRate, 
      account: fromAddress, 
      env: env as any,
    })

    if (nearWalletType === 'btc-wallet') {
        // Generate swap transaction
          const action = await generateTransaction({
              tokenIn: env === 'testnet' ? 'nbtc.toalice.near' : NBTC_ADDRESS,
              tokenOut: ABTC_ADDRESS,
              amountIn: new Big(needSaveNBTC).lt(0) ? estimateResult.receiveAmount.toString() : new Big(estimateResult.receiveAmount).minus(needSaveNBTC).toString(),
              // amountIn: fromAmount.toString(),
              decimals: 8,
              slippage: slippage > 0.2 ? 0.2 : slippage,
          });

          const baseRegisterTransaction = await registerToken(ABTC_ADDRESS, toAddress);

          console.log('baseRegisterTransaction', baseRegisterTransaction,ABTC_ADDRESS, toAddress )

          const registerMsg = baseRegisterTransaction ? 
              {
                receivePreDepositMsg: params,
                transaction: {
                  amount: _fromAmount.toString(),
                  env: (env || 'testnet') as any,
                  feeRate,
                  pollResult: false,
                  newAccountMinDepositAmount: false,
                  action: {
                      receiver_id: 'v2.ref-finance.near',
                      amount: new Big(needSaveNBTC).lt(0) ? new Big(estimateResult.receiveAmount).mul(10 ** 8).toString() : new Big(estimateResult.receiveAmount).minus(needSaveNBTC).mul(10 ** 8).toString(),
                      msg: action.args.msg,
                  },
                  registerContractId: ABTC_ADDRESS,
                }
              }
            :  {
              receivePreDepositMsg: params,
              transaction: {
                amount: _fromAmount.toString(),
                env: (env || 'testnet') as any,
                feeRate,
                pollResult: false,
                newAccountMinDepositAmount: false,
                action: {
                    receiver_id: 'v2.ref-finance.near',
                    amount: new Big(needSaveNBTC).lt(0) ? new Big(estimateResult.receiveAmount).mul(10 ** 8).toString() : new Big(estimateResult.receiveAmount).minus(needSaveNBTC).mul(10 ** 8).toString(),
                    msg: action.args.msg,
                },
              }
            }
            
            return registerMsg;
        
    } else {
        const action = await generateTransaction({
            tokenIn: env === 'testnet' ? 'nbtc.toalice.near' : NBTC_ADDRESS,
            tokenOut: ABTC_ADDRESS,
            amountIn: new Big(needSaveNBTC).lt(0) ? new Big(estimateResult.receiveAmount).toString() : new Big(estimateResult.receiveAmount).minus(needSaveNBTC).toString(),
            decimals: 8,
            slippage: slippage > 0.2 ? 0.2 : slippage,
          });
        const depositMsg: any = {
            recipient_id: toAddress,
            post_actions:[{
                receiver_id: 'v2.ref-finance.near',
                amount:new Big(needSaveNBTC).lt(0) ? new Big(estimateResult.receiveAmount).mul(10 ** 8).toString() : new Big(estimateResult.receiveAmount).minus(needSaveNBTC).mul(10 ** 8).toString(),
                msg: action.args.msg,
                gas: "50000000000000",
            }],
            extra_msg: undefined,
          };
      
        btnTempAddress = await viewMethod({
            method: 'get_user_deposit_address',
            args: {
                deposit_msg: depositMsg
            
            }
        })
        params.nearAddress = toAddress
        params.depositType = 1
        params.postActions = JSON.stringify([{
            receiver_id: 'v2.ref-finance.near',
            // amount: new Big(_fromAmount).minus(2000).toString(),
            amount:new Big(needSaveNBTC).lt(0) ? new Big(estimateResult.receiveAmount).mul(10 ** 8).toString() : new Big(estimateResult.receiveAmount).minus(needSaveNBTC).mul(10 ** 8).toString(),
            msg: action.args.msg,
            gas: "50000000000000",
        }])
        params.extraMsg = undefined;


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