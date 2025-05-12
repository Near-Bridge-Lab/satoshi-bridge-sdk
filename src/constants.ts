// src/constants.ts
export const THIRTY_TGAS = "300000000000000";
export const NO_DEPOSIT = "0";
export const NBTC_ADDRESS = 'nbtc.bridge.near'
export const ABTC_ADDRESS = '31761a152f1e96f966c041291644129144233b0b.factory.bridge.near'
export const CONTRACT_ID = 'btc-connector.bridge.near'

export const getNetworkConfig = (nearNetwork: string, btcNetwork: string) => {
  return {
    near: {
      rpcUrl: `https://rpc.${nearNetwork}.near.org`,
      explorerUrl: `https://explorer.${nearNetwork}.near.org`,
    },
    btc: {
      rpcEndpoint: btcNetwork === 'testnet' 
        ? 'https://blockstream.info/testnet/api/' 
        : 'https://blockstream.info/api/',
      scanUrl: btcNetwork === 'testnet' 
        ? 'https://blockstream.info/testnet' 
        : 'https://blockstream.info',
    }
  };
};
