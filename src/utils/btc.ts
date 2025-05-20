import { useBTCProvider, useBtcWalletSelector, useConnector, estimateDepositAmount, getDepositAmount, getBtcBalance } from 'btc-wallet';
import Big from 'big.js';
import { THIRTY_TGAS, ABTC_ADDRESS, NBTC_ADDRESS } from '../constants';
import { viewMethod,getAccountInfo} from './transaction';
// @ts-ignore
import coinselect from 'coinselect';
import { calculateGasLimit } from 'btc-wallet'

export const estimateBtcGas = async (fromAmount: number | string, feeRate: number, account: string, env: 'mainnet' | 'testnet', useDecimals: boolean = false) => {

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