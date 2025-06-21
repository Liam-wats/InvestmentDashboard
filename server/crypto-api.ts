// Using built-in fetch (Node.js 18+)

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

export interface CryptoPriceData {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

export interface CryptoApiResponse {
  data: { [key: string]: CryptoPriceData };
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

export async function getCryptoPrices(symbols: string[]): Promise<CryptoPriceData[]> {
  if (!COINMARKETCAP_API_KEY) {
    throw new Error('CoinMarketCap API key not configured');
  }

  const symbolsString = symbols.join(',');
  const url = `${BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbolsString}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data: CryptoApiResponse = await response.json();
    
    if (data.status.error_code !== 0) {
      throw new Error(`CoinMarketCap API error: ${data.status.error_message}`);
    }

    return Object.values(data.data);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    throw error;
  }
}

export async function getSingleCryptoPrice(symbol: string): Promise<CryptoPriceData> {
  const prices = await getCryptoPrices([symbol]);
  if (prices.length === 0) {
    throw new Error(`No price data found for ${symbol}`);
  }
  return prices[0];
}

// Cache for crypto prices (5 minute cache)
const priceCache = new Map<string, { data: CryptoPriceData[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedCryptoPrices(symbols: string[]): Promise<CryptoPriceData[]> {
  const cacheKey = symbols.sort().join(',');
  const cached = priceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const prices = await getCryptoPrices(symbols);
  priceCache.set(cacheKey, { data: prices, timestamp: Date.now() });
  
  return prices;
}