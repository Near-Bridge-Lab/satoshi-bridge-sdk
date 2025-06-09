import { useBTCProvider, useBtcWalletSelector, useConnector, estimateDepositAmount, getDepositAmount, getBtcBalance } from 'btc-wallet';
import Big from 'big.js';
import { THIRTY_TGAS, ABTC_ADDRESS, NBTC_ADDRESS } from '../constants';
import { viewMethod,getAccountInfo} from './transaction';
// @ts-ignore
import coinselect from 'coinselect';
import { calculateGasLimit } from 'btc-wallet'
import { querySwap } from './transaction';
import { getBalance } from './transaction';
import { EstimateBtcGasParams } from '../types';

export const estimateBtcGas = async ({
    fromAmount, 
    feeRate, 
    account, 
    toAddress,
    env, 
    useDecimals = false,
    slippage,
    isCustomToken = false,
    tokenOutMetaData = {
        address: ABTC_ADDRESS,
        decimals: 18,
    },
}: EstimateBtcGasParams) => {

    const _fMount = useDecimals ? new Big(fromAmount).mul(10 ** 8).toString() : fromAmount 


    const metaData = await viewMethod({
        method: 'get_config',
        args: {}
    })

    const {
        depositAmount,
        receiveAmount,
        protocolFee,
        repayAmount,
        newAccountMinDepositAmount,
        minDepositAmount

    } = await getDepositAmount(
        String(_fMount),
        {
            env: (env || 'mainnet') as any
        }
    )

    console.log('fromAmount:', receiveAmount, protocolFee, repayAmount, newAccountMinDepositAmount, minDepositAmount)

    const utxos = await getUtxo(account, env)

    let { inputs, outputs, fee } = coinselect(
        utxos,
        [{ address: '', value: Number(_fMount)}],
        Math.ceil(feeRate),
    );

    console.log('fee:', fee, receiveAmount)

    if (depositAmount < minDepositAmount) {
        return {
            isError: true,
            errorMsg:`Invalid deposit amount, must be greater than ${minDepositAmount / 10 ** 8} BTC`,
        }
      }


    if (isCustomToken && slippage) {
      const nbtcBalance = await getBalance(toAddress,  env === 'testnet' ? 'nbtc.toalice.near' : NBTC_ADDRESS, env)
      const needSaveNBTC = new Big(800).div(10 ** 8).minus(nbtcBalance).mul(10 ** 8).toString()
      console.log('needSaveNBTC:', nbtcBalance, needSaveNBTC)
      const querySwapRes = await querySwap({
            tokenIn: NBTC_ADDRESS || 'nbtc.bridge.near',
            tokenOut: tokenOutMetaData.address,
            amountIn: new Big(needSaveNBTC).lt(0) ? new Big(receiveAmount).div(10 ** 8).toString() : new Big(receiveAmount).minus(needSaveNBTC).div(10 ** 8).toString(),
            tokenInDecimals: 8,
            tokenOutDecimals: tokenOutMetaData.decimals,
            slippage: slippage > 0.2 ? 0.2 : slippage,
        })
        return {
            networkFee: fee,
            fee: Number(protocolFee) + Number(repayAmount),
            realAmount: _fMount,
            receiveAmount: new Big(querySwapRes.amountOut).toString(),
            isSuccess: true,
        }
    }

    return {
        networkFee: fee,
        fee: Number(protocolFee) + Number(repayAmount),
        realAmount: _fMount,
        receiveAmount: new Big(receiveAmount).div(10 ** 8).toString(),
        isSuccess: true,
    }
}


const getUtxo = (account: string, env: string) => {
    const blockstreamApi = env === 'testnet' ? 'https://blockstream.info/testnet/api/address' : 'https://blockstream.info/api/address'

    return fetch(`${blockstreamApi}/${account}/utxo`)
        .then(res => res.json()).then(res => {
            return res.filter((item: any) => {
                return item.status.confirmed
            })
        })
}