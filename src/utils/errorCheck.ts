
import Big from 'big.js';


export const validateAmount = ({
    fromAmount,
    walletType,
    tokenBalance,
    max
}: {
    fromAmount: string;
    walletType: string;
    tokenBalance: string | null;
    max?: string;
}) => {
    function isNear(walletType: string) {
        return walletType === 'NEAR'
    }
    function isBtc(walletType: string) {
    return walletType === 'BTC'
    }
    
    function balanceFormatedWithoutRound(balance?: string | number, digits = 8) {
        if (!balance) return '0';
        const _balance = new Big(balance);
        if (_balance.eq(0) || _balance.lt(1 / 10 ** digits)) return '0';
        // if (_balance.lt(1 / 10 ** digits)) return `<${1 / 10 ** digits}`;
        
        //
        const multiplier = new Big(10).pow(digits);
        const truncated = _balance.times(multiplier).round(0, 0).div(multiplier);
        const val = truncated.toFixed(digits);
    
        return val.replace(/(\.?)0+$/, '');
    }


    // 基础校验
    if (!fromAmount || Number(fromAmount) <= 0) {
        return {
            isError: false,
            errorMsg: '',
            gasFee: null,
            tradingFee: null,
            toAmount: '',
            tradingTime: null
        };
    }

    // Near 链校验
    if (isNear(walletType)) {
        if (!tokenBalance || Number(fromAmount) > +balanceFormatedWithoutRound(tokenBalance)) {
            return {
                isError: true,
                errorMsg: 'Insufficient balance'
            };
        }

        if (new Big(fromAmount).plus(0.000008).gt(new Big(tokenBalance || 0))) {
            return {
                isError: true,
                errorMsg: 'You must have at least 0.000008 NBTC in your wallet for gas fee'
            };
        }
    }

    // BTC 链校验
    if (isBtc(walletType)) {

        if (Number(fromAmount) < new Big(5000).div(10 ** 8).toNumber()) {
            return {
                isError: true,
                errorMsg: 'The minimum deposit must be greater than or equal to 5000',
                gasFee: 0,
                toAmount: ''
            };
        }

        if (!tokenBalance || (max && Number(fromAmount) > Number(max))) {
            return {
                isError: true,
                errorMsg: 'Insufficient balance',
                gasFee: 0,
                toAmount: ''
            };
        }
    }

    return null; // 没有错误返回 null
};
