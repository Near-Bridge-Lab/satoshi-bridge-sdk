
const base_url = 'https://api.satos.network/v1'

interface UseStatusProps {
    hash?: string;
    chainId?: '1' | '2';
    signature?: string;
}

interface StatusResponse {
    result_data?: {
        NearHash?: string;
        Status?: number;
    }
}

export const fetchTransactionStatus = async (params: UseStatusProps): Promise<StatusResponse> => {
    let url = ''
    if (params.signature && !params.hash) {
        url = `${base_url}/btcTx?sig=${params.signature}`
    } else if (params.hash && params.chainId) {
        url = `${base_url}/bridgeFromTx?fromTxHash=${params.hash}&fromChainId=${params.chainId}`
    } else {
        throw new Error('Invalid parameters')
    }

    const response = await fetch(url)
    return response.json()
}


export async function getBtcFeeRate(env:string) {
    const rpcEndpoint = env === 'testnet' ? `https://mempool.space/testnet` : `https://mempool.space`;
    const feeRes = await fetch(`${rpcEndpoint}/api/v1/fees/recommended`).then(res => res.json());

    return {
        fast: feeRes.fastestFee,
        avg: feeRes.halfHourFee,
        minimumFee: feeRes.hourFee,
    }
}


export async function getPrice(tokenAddress: string) {
    const price = await fetch(`https://api.ref.finance/get-token-price?token_id=${tokenAddress}`).then(res => res.json());
    return price
}