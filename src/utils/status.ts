
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