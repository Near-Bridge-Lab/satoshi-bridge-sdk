// src/index.ts
import { BtcHandler, NearHandler, BtcOriginHandler, NearOriginHandler } from './handlers';
import { BridgeConfig, BridgeSDK } from './types';


export * from './types';
export * from './constants';
export * from './utils';

export function createBridgeSDK(config: BridgeConfig): BridgeSDK {
  return {
    btc: new BtcHandler(config) as any,
    near: new NearHandler(config) as any,
    btcOrigin: new BtcOriginHandler(config) as any,
    nearOrigin: new NearOriginHandler(config) as any
  };
}

export default createBridgeSDK;