const base_url = 'https://api.satos.network/v1'

export const receiveDepositMsg = async (args: any) => {
    const res = await fetch(`${base_url}/receiveDepositMsg`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(args)
    }).then(res => res.json())
    return res
}

export const receivePreDepositMsg = async (args: any) => {
    const res = await fetch(`${base_url}/preReceiveDepositMsg`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(args)
    }).then(res => res.json())
    return res
}

export const updateWithdraw = async (txHash: string) => {
    return fetch(`${base_url}/receiveWithdrawMsg`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            txHash
        })
    }).then(res => res.json())
}

export const uploadCAWithdraw = async (data: any) => {
    return fetch(`${base_url}/receiveTransaction`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    }).then(res => res.json())
}