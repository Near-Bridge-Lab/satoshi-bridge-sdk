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

## NEAR Wallet Types
The SDK supports various NEAR wallets:
- 'btc-wallet'
- 'my-near-wallet'
- 'meteor-wallet'
- And others


## Parameter Description

| Parameter | Description | Type | Default |
|-----------|-------------|------|---------|
| fromAmount | The amount you want to bridge | number/string (without decimals) | - |
| fromAddress | Your source asset address | string | - |
| toAddress | Your destination address | string | - |
| feeRate | BTC transaction fee rate:<br/>- 5: fast<br/>- 6: average<br/>- 7: slow<br/>- 0: custom | number | 6 |
| env | Environment type:<br/>`mainnet` or `testnet` | string | 'mainnet' |
| fromTokenDecimals | Source token decimals (ABTC/NBTC) for token swap | number | - |
| toTokenDecimals | Destination token decimals (ABTC/NBTC) for token swap | number | - |
| walletId | Your current wallet identifier | string | - |

  


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
        type RepParams = {
                receivePreDepositMsg: {},
                transaction: {
                amount: string,
                env: 'mainnet' | 'testnet',
                feeRate: number | string,
                pollResult: boolean,
                newAccountMinDepositAmount: boolean,
            }
        } 

        type RepParamsNotBtc = {
             receivePreDepositMsg:  {
                nearAddress: string;
                depositType: number;
             },
            transaction: {
                btnTempAddress: string;
                _fromAmount: string;
                feeRate: number;
            }
        }


        const respTransaction:RepParams | RepParamsNotBtc = await BtcOriginHandler.handle( {
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
        type ContractRep = {
              receivePreDepositMsg: {};
              transaction: {
                amount: string;
                env: 'mainnet' | 'testnet';
                feeRate: string | number;
                pollResult: boolean;
                newAccountMinDepositAmount: boolean;
                action: {
                    receiver_id: string;
                    amount: string;
                    msg: string;
                };
                registerContractId?: string;
              }
            }


        const respTransaction:ContractRep = await BtcHandler.handle( {
            fromAmount,
            fromAddress,
            toAddress,
            slippage = 0.05,
            feeRate = 6,
            env = 'mainnet',
            nearWalletType = 'btc-wallet'
        })
      
         const hash: string = await executeBTCDepositAndAction({
                ...respTransaction.transaction,
        })

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

    const estimateResult:EstimateGasResult = await estimateNearGas(fromAmount, fromAddress,toAddress, walletType, isABTC, feeRate, env);

    const respTransaction:Promise<NearOriginHandleResp | {
        isError: boolean,
        errorMsg: string
    }> = await NearOriginHandler.handle({
        fromAmount,
        fromAddress,
        toAddress,
        walletId,
        feeRate,
        env,
    })
   const hash = await wallet.signAndSendTransaction(respTransaction)
   await updateWithdraw(hash)
```

#### Withdrawing ABTC

```js
    import { NearHandler, estimateNearGas, updateWithdraw } from 'satoshi-bridge-sdk'

    type NearHandleResp = {
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
            }
        ]
    }

    const estimateResult:EstimateGasResult = await estimateNearGas(fromAmount, fromAddress,toAddress, walletType, isABTC, feeRate, env);
    

    const respTransaction:Promise<Array<NearHandleResp> | {
        isError: boolean,
        errorMsg: string
    }> = await NearHandler.handle({
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

### Status
```js
 import { fetchTransactionStatus } from 'satoshi-bridge-sdk'

 const res = await fetchTransactionStatus({
    hash: '',
    chainId: '1' | '2' (btc to near: 1, near to btc: 2),
    signature:  // withdraw nbtc can get signature from viewMethod
 })

 success: res.result_data.Status === 4 

```
<!-- 
### Valid
```js
 import {validateAmount} from 'satoshi-bridge-sdk'
 const res = await validateAmount({
    fromAmount,
    walletType: 'NEAR' || 'BTC',
    tokenBalance,
    max
 })
``` -->