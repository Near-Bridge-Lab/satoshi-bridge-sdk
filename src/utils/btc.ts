import { useBTCProvider, useBtcWalletSelector, useConnector, estimateDepositAmount, getDepositAmount, getBtcBalance } from 'btc-wallet';
import Big from 'big.js';
import { THIRTY_TGAS, ABTC_ADDRESS, NBTC_ADDRESS } from '../constants';
import { viewMethod,getAccountInfo} from './transaction';
// @ts-ignore
import coinselect from 'coinselect';
import { calculateGasLimit } from 'btc-wallet'
import { querySwap } from './transaction';
import { getBalance } from './transaction';

export const estimateBtcGas = async ({
    fromAmount, 
    feeRate, 
    account, 
    env, 
    useDecimals = false,
    slippage,
    isABTC = false,
}: {
    fromAmount: number | string;
    feeRate: number;
    account: string;
    env: 'mainnet' | 'testnet';
    useDecimals?: boolean;
    slippage?: number;
    isABTC?: boolean;
}) => {

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
        newAccountMinDepositAmount

    } = await getDepositAmount(
        String(_fMount),
        {
            env: (env || 'mainnet') as any
        }
    )

    console.log('fromAmount:', receiveAmount, protocolFee, repayAmount, newAccountMinDepositAmount)

    const utxos = await getUtxo(account, env)

    let { inputs, outputs, fee } = coinselect(
        utxos,
        [{ address: '', value: Number(_fMount)}],
        Math.ceil(feeRate),
    );

    console.log('fee:', fee, receiveAmount)


    if (isABTC && slippage) {
      const nbtcBalance = await getBalance(account,  env === 'testnet' ? 'nbtc.toalice.near' : NBTC_ADDRESS, env)
      const needSaveNBTC = new Big(800).div(10 ** 8).minus(nbtcBalance)
      console.log('needSaveNBTC:', nbtcBalance, needSaveNBTC)
      const querySwapRes = await querySwap({
            tokenIn: NBTC_ADDRESS || 'nbtc.bridge.near',
            tokenOut: ABTC_ADDRESS,
            amountIn: new Big(needSaveNBTC).lt(0) ? new Big(receiveAmount).div(10 ** 8).toString() : new Big(receiveAmount).minus(needSaveNBTC).div(10 ** 8).toString(),
            tokenInDecimals: 8,
            tokenOutDecimals: 18,
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