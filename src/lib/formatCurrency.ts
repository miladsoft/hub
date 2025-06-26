import type { NetworkType } from '@/contexts/NetworkContext';

export interface CurrencyFormatOptions {
  network: NetworkType;
  currency: 'sats' | 'btc';
  showSymbol?: boolean;
  precision?: number;
}

/**
 * Format Bitcoin amounts based on network and currency preference
 */
export function formatBitcoinAmount(
  sats: number, 
  options: CurrencyFormatOptions
): string {
  const { network, currency, showSymbol = true, precision } = options;

  if (currency === 'sats') {
    const amount = formatNumber(sats);
    return showSymbol ? `${amount} sats` : amount;
  }

  // Convert sats to BTC
  const btcAmount = sats / 100000000;
  const symbol = network === 'testnet' ? 'TBTC' : 'BTC';
  const decimals = precision ?? (btcAmount < 0.001 ? 8 : 8);
  
  const amount = btcAmount.toFixed(decimals);
  return showSymbol ? `${amount} ${symbol}` : amount;
}

/**
 * Get the currency symbol based on network and settings
 */
export function getCurrencySymbol(
  network: NetworkType, 
  currency: 'sats' | 'btc'
): string {
  if (currency === 'sats') {
    return 'sats';
  }
  return network === 'testnet' ? 'TBTC' : 'BTC';
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

/**
 * Format Bitcoin amount for display in project cards
 */
export function formatProjectAmount(
  sats: number,
  network: NetworkType,
  currency: 'sats' | 'btc'
): {
  primary: string;
  secondary?: string;
} {
  if (currency === 'sats') {
    return {
      primary: `${formatNumber(sats)} sats`,
      secondary: formatBitcoinAmount(sats, { network, currency: 'btc', precision: 8 })
    };
  }

  return {
    primary: formatBitcoinAmount(sats, { network, currency: 'btc', precision: 8 }),
    secondary: `${formatNumber(sats)} sats`
  };
}
