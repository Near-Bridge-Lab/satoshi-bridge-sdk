# Bridge SDK

for BTC-NEAR bridge

## Install

```bash
npm install satoshi-bridge-sdk
```

## near walletType
nearWalletType: 'btc-wallet' |  'near-wallet'


## Usage

### BTC->NEAR

if deposit token is NBTC

```js
    import { executeBTCDepositAndAction, useBTCProvider } from 'btc-wallet'
    import { BtcOriginHandler, estimateBtcGas, receivePreDepositMsg,receiveDepositMsg } from 'satoshi-bridge-sdk'

    type EstimateGasResult = {
         networkFee: number,
         fee: number,
         realAmount: string,
         receiveAmount: string,
         isSuccess: boolean,
    }
    const estimateResult: EstimateGasResult = await estimateBtcGas(fromAmount, feeRate, fromAddress, env);
    
    if (nearWalletType === 'btc-wallet') {
        const respTransaction = await BtcOriginHandler.handle( {
            fromAmount,
            fromAddress,
            toAddress,
            feeRate = 6,
            env = 'mainnet',
            nearWalletType = 'btc-wallet'
        })

         const hash: string = await executeBTCDepositAndAction({
            ...respTransaction.transaction
         })
        
        // executeBTCDepositAndAction has help to receivePreDepositMsg and receiveDepositMsg

    } else {
        const { accounts, sendBitcoin, provider, getPublicKey, signMessage } = useBTCProvider();
        const respTransaction = await BtcOriginHandler.handle( {
            fromAmount,
            fromAddress,
            toAddress,
            feeRate = 6,
            env = 'mainnet',
            nearWalletType = 'btc-wallet'
        })
        const { btnTempAddress, _fromAmount,feeRate } = respTransaction.transaction
        await receivePreDepositMsg(params.receivePreDepositMsg)
        const hash: string = await sendBitcoin(btnTempAddress, _fromAmount, {
            feeRate
        })
        await receiveDepositMsg(hash)
    }
```

if deposit token is ABTC

```js
    import { executeBTCDepositAndAction, useBTCProvider } from 'btc-wallet'
    import { BtcHandler, estimateBtcGas, receivePreDepositMsg,receiveDepositMsg } from 'satoshi-bridge-sdk'
    type EstimateGasResult = {
         networkFee: number,
         fee: number,
         realAmount: string,
         receiveAmount: string,
         isSuccess: boolean,
    }
    const estimateResult: EstimateGasResult = await estimateBtcGas(fromAmount, feeRate, fromAddress, env);

    // you must confrim the token is not registered in NEAR 
    // registerContractId: ABTC_ADDRESS 


    if (nearWalletType === 'btc-wallet') {
        const respTransaction = await BtcHandler.handle( {
            fromAmount,
            fromAddress,
            toAddress,
            slippage = 0.05,
            fromTokenAddress,
            toTokenAddress,
            fromTokenDecimals = 18,
            toTokenDecimals = 8,
            walletId = 'my-near-wallet',
            feeRate = 6,
            env = 'mainnet',
            nearWalletType = 'btc-wallet'
        })

        // important
        if (notRegistered) {
              const hash: string = await executeBTCDepositAndAction({
                ...respTransaction.transaction,
                registerContractId: ABTC_ADDRESS,
            })
        } else {
            const hash: string = await executeBTCDepositAndAction({
                ...respTransaction.transaction,
            })
        }
        // executeBTCDepositAndAction has help to receivePreDepositMsg and receiveDepositMsg

    } else {
        // you must confrim the token is not registered in NEAR 
        // registerContractId: ABTC_ADDRESS 
        // after you register the token, you can use the following code

        const { accounts, sendBitcoin, provider, getPublicKey, signMessage } = useBTCProvider();
        const respTransaction = await BtcHandler.handle( {
            fromAmount,
            fromAddress,
            toAddress,
            slippage = 0.05,
            fromTokenAddress,
            toTokenAddress,
            fromTokenDecimals = 18,
            toTokenDecimals = 8,
            walletId = 'my-near-wallet',
            feeRate = 6,
            env = 'mainnet',
            nearWalletType = 'btc-wallet'
        })
        const { btnTempAddress, _fromAmount,feeRate } = respTransaction.transaction
        await receivePreDepositMsg(params.receivePreDepositMsg)
        const hash: string = await sendBitcoin(btnTempAddress, _fromAmount, {
            feeRate
        })
        await receiveDepositMsg(hash)
    }

```


## NEAR->BTC

if withdraw token is NBTC

```js
    import { NearOriginHandler, estimateNearGas, updateWithdraw } from 'satoshi-bridge-sdk'

    const estimateResult = await estimateNearGas(fromAmount, fromAddress,toAddress, walletType, isABTC, feeRate, env);

    const respTransaction = await NearOriginHandler.handle({
        fromAmount,
        fromAddress,
        toAddress,
        feeRate,
        env,
    })
   const hash = await wallet.signAndSendTransactions(respTransaction)
   await updateWithdraw(hash)
```

if withdraw token is ABTC

```js
    import { NearHandler, estimateNearGas, updateWithdraw } from 'satoshi-bridge-sdk'

    const estimateResult = await estimateNearGas(fromAmount, fromAddress,toAddress, walletType, isABTC, feeRate, env);

    const respTransaction = await NearHandler.handle({
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
    })
    const hash = await wallet.signAndSendTransactions(respTransaction)
    await updateWithdraw(hash)
```

