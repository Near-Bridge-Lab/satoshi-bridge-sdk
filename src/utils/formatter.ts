// src/utils/formatter.ts
import Big from 'big.js';

export function balanceFormatedWithoutRound(value: string): string {
  return new Big(value).toFixed();
}

export function parseAmount(amount: string | number, decimals: number = 8): string {
  return new Big(amount).times(new Big(10).pow(decimals)).toFixed(0);
}

export function formatAmount(amount: string | number, decimals: number = 8): string {
  return new Big(amount).div(new Big(10).pow(decimals)).toString();
}


export function uint8ArrayToHex(uint8Array: any) {
    return Array.from(uint8Array)
        .map((byte: any) => byte.toString(16).padStart(2, '0'))
        .join('');
}


export function generateUrl(
    url = '',
    query: Record<string, any>,
    hashes: Record<string, any> = {},
  ) {
    const queryStringParts = [];
    for (const key in query) {
      const value = query[key];
      if ([undefined, null, ''].includes(value)) continue;
      if (Array.isArray(value)) {
        value.forEach((_value) => {
          queryStringParts.push(encodeURIComponent(key) + '[]=' + encodeURIComponent(_value));
        });
      } else {
        queryStringParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      }
    }
    const queryString = queryStringParts.join('&');
    if (queryString) {
      url += url.includes('?') ? '&' : '?';
      url += queryString;
    }
  
    const hashStringParts = [];
    for (const key in hashes) {
      const value = hashes[key];
      if ([undefined, null, ''].includes(value)) continue;
      hashStringParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
    const hashString = hashStringParts.join('&');
    if (hashString) {
      url += '#' + hashString;
    }
  
    return url;
  }
