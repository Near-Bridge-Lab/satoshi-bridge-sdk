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


export const stableTokenMap = {
  'testnet': {
    '31761a152f1e96f966c041291644129144233b0b.factory.bridge.near': 'vastdress3984.near',
    'usdt.tether-token.near': 'usdt-satoshi.sproxy.near',
    '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1': 'usdc-satoshi.sproxy.near',
    '6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near': 'dai-satoshi.sproxy.near',
    '853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near': 'frax-satoshi.sproxy.near'
  },
  'mainnet': {
    '31761a152f1e96f966c041291644129144233b0b.factory.bridge.near': 'abtc-satoshi.sproxy.near',
    'usdt.tether-token.near': 'usdt-satoshi.sproxy.near',
    '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1': 'usdc-satoshi.sproxy.near',
    '6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near': 'dai-satoshi.sproxy.near',
    '853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near': 'frax-satoshi.sproxy.near'
  }
}