export interface Token {
  name: string
  symbol: string
  address: string
  decimals: number
  logoURI: string
  chainId: number
}

export const tokens: Token[] = [
  {
    name: 'Ether',
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    chainId: 8453
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    chainId: 8453
  },
  {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    chainId: 8453
  },
  {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
    chainId: 8453
  },
  {
    name: 'Tether USD',
    symbol: 'USDT',
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    chainId: 8453
  }
]

export const getTokenByAddress = (address: string): Token | undefined => {
  return tokens.find(token => token.address.toLowerCase() === address.toLowerCase())
}

export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase())
}

