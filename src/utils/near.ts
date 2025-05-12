 import Big from 'big.js';
 import { THIRTY_TGAS, ABTC_ADDRESS, NBTC_ADDRESS } from '../constants';
 import { viewMethod,getAccountInfo} from './transaction';
 // @ts-ignore
 import coinselect from 'coinselect';
 import { calculateGasLimit } from 'btc-wallet'

 export async function estimateNearGas(_satoshis: string | number, fromAddress: string,toAddress: string, walletType: string, isABTC?: boolean, feeRate?: number) {
    console.log(_satoshis, fromAddress, toAddress, walletType, isABTC, feeRate, 'sdk estimateNearGas')
    try {
        let gasLimit: any = 0
        const activeToken = isABTC ? ABTC_ADDRESS : NBTC_ADDRESS
        if (walletType === 'btc-wallet' && !isABTC) {
            try {
                gasLimit = await calculateGasLimit({
                    env: (process.env.NEXT_PUBLIC_BTC_WALLET_NET || 'testnet') as any,
                    csna: fromAddress as string,
                    transactions: [{
                        receiverId: activeToken as string,
                        signerId: '',
                        actions: [
                            {
                                type: "FunctionCall",
                                params: {
                                    methodName: 'ft_transfer_call',
                                    args: {
                                        receiver_id: process.env.NEXT_PUBLIC_CONTRACT_ID,
                                        amount: '100',
                                        msg: ''
                                    },
                                    gas: THIRTY_TGAS,
                                    deposit: '1',
                                },
                            },
                        ],
                    }]
                })

                gasLimit = Number(gasLimit)
            } catch (e) {
                console.log('estimateGas error:', e)
            }
        }

        let satoshis = Number(_satoshis)


        if (gasLimit > 0) {
            satoshis = new Big(_satoshis).minus(gasLimit).toNumber()
        }

        // Get bridge configuration
        const metaData = await viewMethod({
            method: 'get_config',
            args: {}
        })


        // Check minimum withdraw amount
        if (metaData.min_withdraw_amount) {
            if (Number(satoshis) < Number(metaData.min_withdraw_amount)) {
                return {
                    withdrawFee: 0,
                    isError: true,
                    errorMsg: `Mini withdraw amount is ${(Number(metaData.min_withdraw_amount) + Number(gasLimit))}`,
                }
            }
        }

        // Calculate withdraw fee
        const feePercent = Number(metaData.withdraw_bridge_fee.fee_rate) * Number(satoshis)
        const withdrawFee = feePercent > Number(metaData.withdraw_bridge_fee.fee_min) 
            ? feePercent 
            : Number(metaData.withdraw_bridge_fee.fee_min)

        const withdrawChangeAddress = metaData.change_address
        const minChangeAmount = Number(metaData.min_change_amount)

        // Get all UTXOs
        const allUTXO = await viewMethod({
            method: 'get_utxos_paged',
            args: {},
        })

        // Filter UTXOs by minimum change amount
        const utxos = Object.keys(allUTXO).map(key => {
            const txid = key.split('@')
            return {
                txid: txid[0],
                vout: allUTXO[key].vout,
                value: Number(allUTXO[key].balance),
                script: allUTXO[key].script,
            }
        }).filter(utxo => {
            return utxo.value > minChangeAmount
        })

        if (!utxos || utxos.length === 0) {
            return {
                withdrawFee,
                isError: true,
                errorMsg: 'The network is busy, please try again later.',
            }
        }

        const userSatoshis = Number(satoshis)
        const maxBtcFee = Number(metaData.max_btc_gas_fee)

        // Use coinselect to calculate inputs, outputs, and fee
        const { inputs, outputs, fee } = coinselect(
            utxos,
            [{ address: toAddress, value: userSatoshis }],
            Math.ceil(feeRate || 6),
        )

        const newInputs = inputs
        let newOutputs = outputs
        let newFee = fee

        if (!newOutputs || newOutputs.length === 0) {
            return {
                withdrawFee,
                isError: true,
                errorMsg: 'The network is busy, please try again later.',
            }
        }

        let userOutput, noUserOutput
        for (let i = 0; i < newOutputs.length; i++) {
            const output = newOutputs[i]
            if (output.value.toString() === userSatoshis.toString()) {
                userOutput = output
            } else {
                noUserOutput = output
            }
            if (!output.address) {
                output.address = withdrawChangeAddress
            }
        }

        let dis = 0
        if (newFee > maxBtcFee) {
            dis = newFee - maxBtcFee
            newFee = maxBtcFee

            return {
                gasFee: newFee,
                withdrawFee,
                isError: true,
                errorMsg: 'Gas exceeds maximum value',
            }
        }

        userOutput.value = new Big(userOutput.value).minus(newFee).minus(withdrawFee).toNumber()

        if (userOutput.value < 0) {
            return {
                gasFee: newFee,
                withdrawFee,
                isError: true,
                errorMsg: 'Not enough gas',
            }
        }

        if (noUserOutput) {
            if (!noUserOutput.address) {
                noUserOutput.address = withdrawChangeAddress
            }
            noUserOutput.value = new Big(noUserOutput.value)
                .plus(newFee)
                .plus(withdrawFee)
                .plus(dis)
                .toNumber()
        } else {
            noUserOutput = {
                address: withdrawChangeAddress,
                value: new Big(newFee).plus(withdrawFee).plus(dis).toNumber()
            }
            newOutputs.push(noUserOutput)
        }

        let minValue = Math.min(...newInputs.map((input: any) => input.value))
        let totalNoUserOutputValue = noUserOutput.value

        while (totalNoUserOutputValue >= minValue && minValue > 0 && newInputs.length > 0) {
            totalNoUserOutputValue -= minValue
            noUserOutput.value = totalNoUserOutputValue
            const minValueIndex = newInputs.findIndex((input: any) => input.value === minValue)
            if (minValueIndex > -1) {
                newInputs.splice(minValueIndex, 1)
            }
            minValue = Math.min(...newInputs.map((input: any) => input.value))
        }

        let gasMore = 0
        if (noUserOutput.value === 0) {
            newOutputs = newOutputs.filter((item: any) => item.value !== 0)
        } else if (noUserOutput.value < minChangeAmount) {
            gasMore = minChangeAmount - noUserOutput.value
            userOutput.value -= gasMore
            noUserOutput.value = minChangeAmount
            
            // Check if user output becomes negative after change adjustment
            if (userOutput.value < 0) {
                return {
                    gasFee: newFee,
                    withdrawFee,
                    isError: true,
                    errorMsg: 'Not enough funds to cover minimum change amount',
                }
            }
        }

        // 
        if (userOutput.value < Number(metaData.min_withdraw_amount)) {
            const minWithdrawAmount = new Big(metaData.min_withdraw_amount)
                .plus(minChangeAmount)
                .plus(gasLimit)
                .plus(withdrawFee)
                .toNumber()
            
            return {
                gasFee: newFee,
                withdrawFee,
                isError: true,
                errorMsg: `Final amount too small. Minimum required: ${minWithdrawAmount}`,
            }
        }

        // Check for insufficient outputs
        const insufficientOutput = newOutputs.some((item: any) => item.value < 0)
        if (insufficientOutput) {
            return {
                gasFee: newFee,
                withdrawFee,
                isError: true,
                errorMsg: 'Not enough gas',
            }
        }

        // Check for outputs below minimum change amount
        const belowMinChangeAmount = newOutputs.some(
            (item: any) => item.value > 0 && item.value < minChangeAmount
        )
        if (belowMinChangeAmount) {
            // Calculate minimum withdraw amount: min_change_amount + gas + fee
            const minWithdrawAmount = new Big(metaData.min_withdraw_amount)
                .plus(minChangeAmount)
                .plus(gasLimit)
                .plus(withdrawFee)
                .toNumber()

            return {
                gasFee: newFee,
                withdrawFee,
                isError: true,
                errorMsg: `Transaction amount too small. Minimum required: ${minWithdrawAmount}`,
            }
        }

        // Verify input and output sums match
        const inputSum = newInputs.reduce((sum: number, cur: any) => sum + Number(cur.value), 0)
        const outputSum = newOutputs.reduce((sum: number, cur: any) => sum + Number(cur.value), 0)
        
        if (newFee + outputSum !== inputSum) {
            return {
                withdrawFee,
                isError: true,
                errorMsg: 'Service busy, please try again later',
            }
        }

        return {
            withdrawFee: new Big(withdrawFee).plus(gasLimit).plus(gasMore).toNumber(),
            gasFee: new Big(newFee).toNumber(),
            inputs: newInputs,
            outputs: newOutputs,
            fromAmount: satoshis,
            receiveAmount: new Big(userOutput.value).div(10 ** 8).toString(),
            isError: false,
            errorMsg: '',
            utxosInput: newInputs,
            withdrawFeeOrigin: withdrawFee,
            gasMore
        }
    } catch (error: any) {
        return {
            withdrawFee: 0,
            isError: true,
            errorMsg: error.message || 'An unexpected error occurred',
        }
    }
}