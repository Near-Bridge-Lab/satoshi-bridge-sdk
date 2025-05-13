# Bridge SDK

for BTC-NEAR bridge

## Install

```bash
npm install satoshi-bridge-sdk
```

## Project Structure

```
satoshi-bridge-sdk/
├── src/
│   ├── handlers/
│   │   ├── BtcHandler.ts         # Handles ABTC deposits
│   │   ├── BtcOriginHandler.ts   # Handles NBTC deposits
│   │   ├── NearHandler.ts        # Handles ABTC withdrawals
│   │   └── NearOriginHandler.ts  # Handles NBTC withdrawals
│   ├── utils/
│   │   ├── estimateGas.ts        # Gas estimation utilities
│   │   ├── transactions.ts       # Transaction helpers
│   │   └── wallets.ts            # Wallet integration utilities
│   │   └── uploadHash.ts         # upload hash to services
│   ├── types.ts                  # Type definitions
│   ├── constants.ts              # SDK constants and configurations
│   └── index.ts                  # Main entry point
├── package.json
└── README.md
```

## near walletType
nearWalletType: 'btc-wallet' |  'my-near-wallet' | 'meteor-wallet' | eg.

## NEAR Wallet Types
The SDK supports various NEAR wallets:
- 'btc-wallet'
- 'my-near-wallet'
- 'meteor-wallet'
- And others

## Usage

### BTC->NEAR Bridge

#### Depositing NBTC

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
    //you can estimate the gas fee
    const estimateResult: EstimateGasResult = await estimateBtcGas(fromAmount, feeRate, fromAddress, env);
    
    if (nearWalletType === 'btc-wallet') {
        const respTransaction = await BtcOriginHandler.handle( {
            fromAmount,
            fromAddress,
            toAddress,
            feeRate = 6,
            env = 'mainnet',
            nearWalletType = 'btc-wallet' // your wallet id such as 'my-near-wallet' ,'btc-wallet' , 'meteor-wallet' eg.
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

#### Depositing ABTC

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
     //you can estimate the gas fee
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


### NEAR->BTC Bridge

#### Withdrawing NBTC

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

#### Withdrawing ABTC

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

