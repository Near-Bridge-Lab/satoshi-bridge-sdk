// src/handlers/btcHandler.ts
import Big from 'big.js';
import { BridgeConfig, BtcHandleParams, EstimateGasResult } from '../types';
import { viewMethod, registerToken } from '../utils/transaction';
import { executeBTCDepositAndAction } from 'btc-wallet';
import { balanceFormatedWithoutRound } from '../utils/formatter';
import { querySwap } from '../utils/transaction';
import { ABTC_ADDRESS, NBTC_ADDRESS,THIRTY_TGAS } from '../constants';
import { estimateNearGas } from '../utils/near';
import * as bitcoin from 'bitcoinjs-lib';
import ecc from '@bitcoinerlab/secp256k1';
import {getNetworkConfig} from '../constants'
import { parseAmount, uint8ArrayToHex } from '../utils/formatter';
import { NearHandleResp } from '../types';




bitcoin.initEccLib(ecc)


export const NearHandler = {

  async handle({
    fromAmount,
    fromAddress,
    toAddress,
    slippage = 0.05,
    walletId = 'my-near-wallet',
    feeRate = 6,
    env = 'mainnet'
  }: {
    fromAmount: string,
    fromAddress: string,
    toAddress: string,
    walletId: string,
    slippage?: number,
    feeRate?: number,
    env?: string
  }): Promise<Array<NearHandleResp> | {
    isError: boolean,
    errorMsg: string
  }> {
            const proxyContract = env === 'testnet' ? 'vastdress3984.near' : 'abtc-satoshi.sproxy.near'
            const nBtcInOut:any = {};
            const fromTokenAddress = '31761a152f1e96f966c041291644129144233b0b.factory.bridge.near'
            const toTokenAddress = env === 'testnet' ? 'nbtc.toalice.near' : 'nbtc.bridge.near'
            // First query the swap to get expected output amount
            const querySwapRes = await querySwap({
                tokenIn: fromTokenAddress,
                tokenOut: toTokenAddress,
                amountIn: fromAmount,
                tokenInDecimals: 18,
                tokenOutDecimals: 8,
                slippage: slippage > 0.2 ? 0.2 : slippage,
            })
            // const baseRegisterTransaction = await registerToken(ABTC_ADDRESS, fromAddress);
            const satoshis = (querySwapRes as any).amount_out
            // const account_id = toAddress;
            const estimateResult = await estimateNearGas(
                Number(satoshis),
                fromAddress,
                toAddress,
                walletId,
                true,
                feeRate,
                env
            );

            if (!estimateResult || estimateResult.isError) {
                return {
                    isError: true,
                    errorMsg: estimateResult?.errorMsg || 'Estimate gas failed'
                };
            }
            
            nBtcInOut.current = {
                inputs: estimateResult.inputs,
                outputs: estimateResult.outputs,
            };
            
            
            const { inputs, outputs } = nBtcInOut.current;
            
            const network = env === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
            const psbt = new bitcoin.Psbt({ network });
            
            const btcConfig = {
                name: 'BTC',
                rpcEndpoint: env === 'testnet' ? `https://blockstream.info/testnet/api/`: `https://blockstream.info/api/`,
                scanUrl: env === 'testnet' ? 'https://blockstream.info/testnet' : 'https://blockstream.info',
            }

            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const txData = await fetch(`${btcConfig.rpcEndpoint}tx/${input.txid}`).then(res => res.json());
                
                const inputOptions = {
                    hash: input.txid,
                    index: input.vout,
                    sequence: 0xfffffffd,
                    witnessUtxo: {
                        script: Buffer.from(txData.vout[input.vout].scriptpubkey, 'hex'),
                        value: input.value
                    }
                };
                
                psbt.addInput(inputOptions);
            }
            
            outputs.forEach((output: { address: string; value: any }) => {
                if (!output.address) {
                    output.address = toAddress as string;
                }
                psbt.addOutput({
                    address: output.address,
                    value: output.value,
                });
            });
            
            const _inputs = inputs.map((item: any) => {
                return `${item.txid}:${item.vout}`;
            });
            
            const txOutputs = psbt.txOutputs.map((item: any) => {
                return {
                    script_pubkey: uint8ArrayToHex(item.script),
                    value: item.value
                };
            });
            
            const waiteDealSwapRes = (querySwapRes as any).routes[0].pools;
            const processedPools = waiteDealSwapRes.map((item: any) => {
                const { amount_in, pool_id, ...rest } = item;
                
                // Only include amount_in if it's not '0' or 0
                const result = {
                    ...rest,
                    pool_id: Number(pool_id)
                };
                
                if (amount_in !== '0' && amount_in !== 0) {
                    result.amount_in = amount_in;
                }
                
                return result;
            });

            const sumInputAmounts:any =  [];
            estimateResult?.utxosInput.forEach((item: any) => {
                sumInputAmounts.push(item.value.toString())
            })

            const msgNewProxyFtStr = {
                ToBtc: {
                    actions: [...processedPools],
                    withdraw_nbtc_args: {
                        bridge_withdraw_fee: {
                            fee_min: (1000 + (estimateResult?.gasMore || 0)).toString(),
                            fee_rate: 0,
                            protocol_fee_rate: 9000
                        },
                        target_btc_address: toAddress,
                        input: _inputs,
                        output: txOutputs,
                        input_amounts: sumInputAmounts,
                    }
                }
            };
            
            const msgStr = JSON.stringify(msgNewProxyFtStr);


            // return;
            
            // Prepare the transactions array
            const transactions: any = [];
            
            // if (baseRegisterTransaction) {
            //     transactions.push(baseRegisterTransaction);
            // }
            
            const parsedAmountIn = parseAmount(fromAmount, 18);
            
            // Add the transfer transaction
            transactions.push({
                receiverId: ABTC_ADDRESS,
                actions: [
                    {
                        type: "FunctionCall",
                        params: {
                            methodName: 'ft_transfer_call',
                            args: {
                                receiver_id: proxyContract,
                                amount: parsedAmountIn.toString(),
                                msg: msgStr
                            },
                            gas: THIRTY_TGAS,
                            deposit: '1',
                        },
                    },
                ],
            });
            return transactions;
    }
}

