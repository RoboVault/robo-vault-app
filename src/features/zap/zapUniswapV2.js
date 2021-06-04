import { pack, keccak256 } from '@ethersproject/solidity';
import { getCreate2Address } from '@ethersproject/address';
import { getNetworkTokens, getNetworkZaps, getNetworkCoin } from 'features/helpers/getNetworkData';

const availableZaps = getNetworkZaps();
const availableTokens = getNetworkTokens();
const nativeCoin = getNetworkCoin();

export const getEligibleZap = pool => {
  if (pool.assets.length !== 2) return undefined;

  const eligibleNativeCoin = [];
  const tokenSymbols = pool.assets.map(symbol => {
    if (nativeCoin.symbol === symbol) {
      const wrappedToken = availableTokens[nativeCoin.wrappedSymbol];
      nativeCoin.address = wrappedToken.address;
      eligibleNativeCoin.push(nativeCoin);
      return nativeCoin.wrappedSymbol;
    }
    return symbol;
  });

  let tokenA, tokenB;
  let missingTokenSymbols = [];
  const zap = availableZaps.find(zap => {
    tokenA = availableTokens[tokenSymbols[0]];
    tokenB = availableTokens[tokenSymbols[1]];
    if (tokenA && tokenB) {
      return (
        pool.tokenAddress ===
        computePairAddress(zap.ammFactory, zap.ammPairInitHash, tokenA.address, tokenB.address)
      );
    } else {
      if (!tokenA) {
        missingTokenSymbols.push(tokenSymbols[0]);
      }
      if (!tokenB) {
        missingTokenSymbols.push(tokenSymbols[1]);
      }
    }
  });

  for (const symbol of missingTokenSymbols) {
    console.error('Beefy: token missing in the tokenlist:', symbol);
  }

  if (!zap) return undefined;

  tokenA.allowance = 0;
  tokenB.allowance = 0;

  return {
    ...zap,
    tokens: [tokenA, tokenB, ...eligibleNativeCoin],
  };
};

export const computePairAddress = (factoryAddress, pairInitHash, tokenA, tokenB) => {
  const [token0, token1] = sortTokens(tokenA, tokenB);
  return getCreate2Address(
    factoryAddress,
    keccak256(['bytes'], [pack(['address', 'address'], [token0, token1])]),
    pairInitHash
  );
};

export const sortTokens = (tokenA, tokenB) => {
  if (tokenA === tokenB) throw new RangeError(`tokenA should not be equal to tokenB: ${tokenB}`);
  return tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
};
