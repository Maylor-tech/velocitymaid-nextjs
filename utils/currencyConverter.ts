/**
 * Currency Conversion Utilities
 * 
 * Handles JMD/USD conversion with configurable exchange rate
 */

// Default exchange rate (can be overridden by env or admin setting)
const DEFAULT_EXCHANGE_RATE = 155.0; // 1 USD = 155 JMD (approximate)

/**
 * Get current exchange rate
 * Priority: Environment variable > Default
 */
export function getExchangeRate(): number {
  const envRate = process.env.JMD_USD_EXCHANGE_RATE;
  if (envRate) {
    const rate = parseFloat(envRate);
    if (!isNaN(rate) && rate > 0) {
      return rate;
    }
  }
  return DEFAULT_EXCHANGE_RATE;
}

/**
 * Convert USD to JMD
 */
export function convertUSDToJMD(usdAmount: number, exchangeRate?: number): number {
  const rate = exchangeRate || getExchangeRate();
  return Math.round(usdAmount * rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert JMD to USD
 */
export function convertJMDToUSD(jmdAmount: number, exchangeRate?: number): number {
  const rate = exchangeRate || getExchangeRate();
  return Math.round((jmdAmount / rate) * 100) / 100; // Round to 2 decimal places
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'JMD') {
    return `J$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get combined revenue in JMD
 * Converts USD to JMD and adds to JMD revenue
 */
export function getCombinedRevenueJMD(
  jmdRevenue: number,
  usdRevenue: number,
  exchangeRate?: number
): number {
  const usdInJMD = convertUSDToJMD(usdRevenue, exchangeRate);
  return jmdRevenue + usdInJMD;
}


