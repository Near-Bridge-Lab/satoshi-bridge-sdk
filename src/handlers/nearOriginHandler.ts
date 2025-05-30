// src/handlers/btcHandler.ts
import Big from 'big.js';
import { ABTC_ADDRESS, NBTC_ADDRESS,THIRTY_TGAS } from '../constants';
import { estimateNearGas } from '../utils/near';
import * as bitcoin from 'bitcoinjs-lib';
import { parseAmount, uint8ArrayToHex } from '../utils/formatter';


type NearOriginHandleResp ={
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



export const NearOriginHandler = {
  async handle(
    {
        fromAmount,
        fromAddress,
        toAddress,
        walletId = 'my-near-wallet',
        feeRate = 6,
        env = 'mainnet'
      }: {
        fromAmount: string,
        fromAddress: string,
        toAddress: string,
        walletId: string,
        feeRate?: number,
        env?: string
      }
  ): Promise<NearOriginHandleResp | {
    isError: boolean,
    errorMsg: string
  }> {
    const nBtcInOut:any = {};
    let fromAmountMinus = fromAmount;
    let isError = false;

    const estimateResult = await estimateNearGas(
       {
        _satoshis: new Big(fromAmount).mul(10 ** 8).toString(),
        fromAddress,
        toAddress,
        walletType: walletId,
        isABTC: false,
        feeRate,
        env,
        useDecimals: false
       }
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

    fromAmountMinus = estimateResult?.fromAmount?.toString() || new Big(fromAmount.toString()).mul(10 ** 8).toString()

    if (isError || !nBtcInOut.current) {
        return {
            isError: true,
            errorMsg: 'Estimate gas failed'
        }
    }

    const satoshis = fromAmountMinus


    const { inputs, outputs } = nBtcInOut.current


    const network = env === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin

    const psbt = new bitcoin.Psbt({ network });

     
    const btcConfig = {
        name: 'BTC',
        rpcEndpoint: env === 'testnet' ? `https://blockstream.info/testnet/api/`: `https://blockstream.info/api/`,
        scanUrl: env === 'testnet' ? 'https://blockstream.info/testnet' : 'https://blockstream.info',
    }
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]
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

    // const bufs = psbt.toHex()

    const _inputs = inputs.map((item: any) => {
        return `${item.txid}:${item.vout}`
    })

    const txOutputs = psbt.txOutputs.map((item: any) => {
        return {
            script_pubkey: uint8ArrayToHex(item.script),
            value: item.value
        }
    })


    const msg = {
        Withdraw: {
            target_btc_address: toAddress,
            input: _inputs,
            output: txOutputs,
            // psbt_hex: bufs
        }
    }

    const msgStr = JSON.stringify(msg)


    // const transaction = []
    //     transaction.push({
    //         receiverId: 'nbtc.bridge.near',
    //         actions: [
    //         {
    //             type: "FunctionCall",
    //             params: {
    //                 methodName: 'ft_transfer_call',
    //                 args: {
    //                     receiver_id: 'btc-connector.bridge.near',
    //                     amount: satoshis.toString(),
    //                     msg: msgStr
    //                 },
    //                 gas: THIRTY_TGAS,
    //                 deposit: '1',
    //             },
    //         },
    //     ],
    // })
    return {
            receiverId: env === 'testnet' ? 'nbtc.toalice.near' : 'nbtc.bridge.near',
            actions: [
            {
                type: "FunctionCall",
                params: {
                    methodName: 'ft_transfer_call',
                    args: {
                        receiver_id: env === 'testnet' ? 'brg.toalice.near' : 'btc-connector.bridge.near',
                        amount: satoshis.toString(),
                        msg: msgStr
                    },
                    gas: THIRTY_TGAS,
                    deposit: '1',
                },
            },
        ],
    };
  }
}