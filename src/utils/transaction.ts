// src/utils/transaction.ts
import { providers } from "near-api-js";
import { QuerySwapParams, NearQuerySwapResponse } from "../types";
import Big from "big.js";
import { parseAmount, formatAmount, generateUrl,safeJSONParse } from "./formatter";
import request from './request'
import { FinalExecutionOutcome, QueryResponseKind } from 'near-api-js/lib/providers/provider';
import { CONTRACT_ID } from "../constants";
import { type FunctionCallAction, type Transaction } from '@near-wallet-selector/core';

export function getProvider(network: string) {
  const url = `https://rpc.${network}.near.org`;
  const provider = new providers.JsonRpcProvider({ url });
  return provider;
}

export async function viewMethod({ 
  method, 
  args = {},
  contractId = CONTRACT_ID, 
  network = 'mainnet'
}: {
  method: string,
  args: any,
  network?: string
  contractId?: string,
}) {

  console.log(method, args, contractId, network, '29>>>')
  const provider = getProvider(network);
  const res: any = await provider.query({
    request_type: "call_function",
    account_id: contractId,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  });

  return JSON.parse(Buffer.from(res.result).toString());
}

export async function getBalance(account: string, tokenId: string, network = 'mainnet', isCustomToken = false) {
  console.log(account, tokenId, network, isCustomToken, '41>>>')


  const provider = getProvider(network);
  
  const res: any = await provider.query({
    request_type: "call_function",
    account_id: tokenId,
    method_name: 'ft_balance_of',
    args_base64: Buffer.from(JSON.stringify({
      account_id: account
    })).toString("base64"),
    finality: "final",
  });

  const amount = Buffer.from(res.result).toString();
  const newAmount = amount.replace(/"/g, '');
  const decimals = isCustomToken ? 18 : 8;
  
  console.log(amount, newAmount, decimals, '60>>>')

  return parseInt(newAmount) > 0 ? (parseInt(newAmount) / (10 ** decimals)).toString() : '0';
}

export async function querySwap({
    tokenIn,
    tokenOut,
    amountIn,
    pathDeep = 3,
    slippage = 0.005,
    routerCount,
    tokenInDecimals,
    tokenOutDecimals
  }: QuerySwapParams) {
    if (new Big(amountIn).eq(0)) return { amountIn: 0, amountOut: 0, minAmountOut: 0 };
    const currentSlippage = slippage
    const parsedAmountIn = parseAmount(amountIn, tokenInDecimals);
    const { result_data } = await request<{ result_data: NearQuerySwapResponse }>(
      generateUrl(`https://smartrouter.ref.finance/findPath`, {
        tokenIn,
        tokenOut,
        amountIn: parsedAmountIn,
        pathDeep,
        slippage: currentSlippage,
        routerCount,
      }),
      { cacheTimeout: 3000 },
    );
    const amountOut = formatAmount(result_data.amount_out || 0, tokenOutDecimals);
    const minAmountOut = new Big(amountOut).times(1 - slippage).toString();
    return {
      ...result_data,
      amountIn,
      amountOut,
      minAmountOut,
    };
}


export async function getAccountInfo(account: string, network: string) {
    const provider = getProvider(network)

    const res1: any = await provider.query({
        request_type: "call_function",
        account_id: network === 'testnet' ? 'acc.toalice.near' : 'acc.ref-labs.near',
        method_name: 'get_account',
        args_base64: Buffer.from(JSON.stringify({
            account_id: account
        })).toString("base64"),
        finality: "final",
    });

    const accountInfo = Buffer.from(res1.result).toString()

    if (accountInfo) {
        return JSON.parse(accountInfo)
    }

    return null
}

export const registerToken = async (token: string, recipient?: string) => {
    const accountId = recipient;
    const res = await query<{
      available: string;
      total: string;
    }>({
      contractId: token,
      method: 'storage_balance_of',
      args: { account_id: recipient || accountId },
    });
    if (!res?.available) {
      return {
        receiverId: token,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                account_id: recipient || accountId,
                registration_only: true,
              },
              deposit: '1250000000000000000000',
              gas: parseAmount(100, 12),
            },
          },
        ],
      } as any;
    }
  }


export const query = async <T = any>({
    contractId,
    method,
    args = {},
    network = 'mainnet',
  }: {
    contractId: string;
    method: string;
    args?: any;
    gas?: string;
    deposit?: string;
    network?: string;
  }) => {
    try {
      if (typeof window === 'undefined') return;
      const provider = getProvider(network)
      // console.log(`${method} args`, args);
      const res = await provider.query({
        request_type: 'call_function',
        account_id: contractId,
        method_name: method,
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
        finality: 'final',
      });
      const result = JSON.parse(
        Buffer.from((res as QueryResponseKind & { result: number[] }).result).toString(),
      ) as T;
      // console.log(`${method} ${contractId} result`, result);
      return result;
    } catch (error) {
      console.error(`${method} error`, error);
    }
  }

export const generateTransaction = async ({
    tokenIn,
    tokenOut,
    amountIn,
    pathDeep = 3,
    slippage = 0.005,
    routerCount,
    decimals = 18,
  }: any) => {
    const parsedAmountIn = parseAmount(amountIn, decimals);
    const {
      result_data: { methodName, args, gas },
    } = await request<{ result_data: FunctionCallAction['params'] }>(
      generateUrl(`https://smartrouter.ref.finance/swapPath`, {
        tokenIn,
        tokenOut,
        amountIn: parsedAmountIn,
        pathDeep,
        slippage,
      }),
    );
    const parsedMsg = safeJSONParse<any>((args as any).msg);
    if (!parsedMsg?.actions.length) throw new Error('No swap path found');
   
    const newArgs = { ...args, msg: JSON.stringify(parsedMsg) };
    return {
      methodName,
      gas,
      deposit: '1',
      args: { ...newArgs, receiver_id:'v2.ref-finance.near' },
    };
  } 