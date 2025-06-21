export interface CoinData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

class CryptoService {
  private cache = new Map<string, { data: CoinData[]; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 1 minute

  async getTopCoins(limit: number = 10): Promise<CoinData[]> {
    const cacheKey = `top-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch('/api/crypto/prices?limit=' + limit);
      if (!response.ok) {
        throw new Error('Failed to fetch crypto prices');
      }
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return this.getFallbackData(limit);
    }
  }

  async getCoinPrice(symbol: string): Promise<CoinData | null> {
    try {
      const response = await fetch(`/api/crypto/price/${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${symbol} price`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${symbol} price:`, error);
      return null;
    }
  }

  formatPrice(price: number): string {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } else if (price >= 1) {
      return price.toFixed(4);
    } else {
      return price.toFixed(6);
    }
  }

  formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  }

  private getFallbackData(limit: number): CoinData[] {
    const fallback = [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 43250, change24h: 2.5, marketCap: 850000000000, volume24h: 25000000000 },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 2580, change24h: -1.2, marketCap: 310000000000, volume24h: 15000000000 },
      { id: 'binancecoin', name: 'BNB', symbol: 'BNB', price: 315, change24h: 0.8, marketCap: 47000000000, volume24h: 1200000000 },
      { id: 'tether', name: 'Tether', symbol: 'USDT', price: 1.00, change24h: 0.01, marketCap: 95000000000, volume24h: 45000000000 },
    ];
    
    return fallback.slice(0, limit);
  }
}

export const cryptoService = new CryptoService();