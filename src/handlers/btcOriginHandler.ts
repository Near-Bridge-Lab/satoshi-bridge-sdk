// src/handlers/btcHandler.ts
import Big from 'big.js';
import { BridgeConfig, BtcHandleParams, EstimateGasResult } from '../types';
import { viewMethod } from '../utils/transaction';
import { executeBTCDepositAndAction } from 'btc-wallet';
import { balanceFormatedWithoutRound } from '../utils/formatter';

export class BtcOriginHandler {
  private config: BridgeConfig;
  private feeRate: number;

  constructor(config: BridgeConfig, feeRate: number = 30) {
    this.config = config;
    this.feeRate = feeRate;
  }

  async handle() {
    console.log('btc origin handler handle')
  }
}