// src/handlers/btcHandler.ts
import Big from 'big.js';
import { BridgeConfig, BtcHandleParams, EstimateGasResult } from '../types';
import { viewMethod } from '../utils/transaction';
import { executeBTCDepositAndAction } from 'btc-wallet';
import { balanceFormatedWithoutRound } from '../utils/formatter';

export const BtcOriginHandler = {

  async handle() {
    console.log('btc origin handler handle')
  }
}