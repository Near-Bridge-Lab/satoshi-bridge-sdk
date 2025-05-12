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


bitcoin.initEccLib(ecc)

const proxyContract = process.env.NEXT_PUBLIC_ABTC_PROXY_ID || 'abtc-satoshi.sproxy.near'

export const NearHandler = {

  async handle({
    fromAmount,
    fromAddress,
    toAddress,
    slippage = 0.05,
    fromTokenAddress = ABTC_ADDRESS,
    toTokenAddress = NBTC_ADDRESS,
    fromTokenDecimals = 18,
    toTokenDecimals = 8,
    walletId = 'my-near-wallet',
    feeRate = 6,
    isABTC = true,
    env = 'mainnet'
  }: {
    fromAmount: string,
    fromAddress: string,
    toAddress: string,
    walletId: string,
    slippage?: number,
    fromTokenAddress?: string,
    toTokenAddress?: string,
    fromTokenDecimals?: number,
    toTokenDecimals?: number,
    feeRate?: number,
    isABTC?: boolean,
    env?: string
  }): Promise<Array<any> | null> {
            const nBtcInOut:any = {};
            // First query the swap to get expected output amount
            const querySwapRes = await querySwap({
                tokenIn: fromTokenAddress,
                tokenOut: toTokenAddress,
                amountIn: fromAmount,
                tokenInDecimals: fromTokenDecimals,
                tokenOutDecimals: toTokenDecimals,
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
                isABTC,
                feeRate
            );

            if (!estimateResult || estimateResult.isError) {
                return estimateResult?.errorMsg;
            }
            
            nBtcInOut.current = {
                inputs: estimateResult.inputs,
                outputs: estimateResult.outputs,
            };
            
            
            const { inputs, outputs } = nBtcInOut.current;
            
            const network = process.env.NEXT_PUBLIC_BTC_NET === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
            const psbt = new bitcoin.Psbt({ network });
            
            const btcConfig = {
                name: 'BTC',
                rpcEndpoint: process.env.NEXT_PUBLIC_BTC_NET === 'testnet' ? `https://blockstream.info/testnet/api/`: `https://blockstream.info/api/`,
                scanUrl: process.env.NEXT_PUBLIC_BTC_NET === 'testnet' ? 'https://blockstream.info/testnet' : 'https://blockstream.info',
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

