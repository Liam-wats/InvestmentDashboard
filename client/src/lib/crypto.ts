export interface CoinData {
  id: number;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
}

class CryptoService {
  async getTopCoins(limit: number = 10): Promise<CoinData[]> {
    try {
      const response = await fetch(`/api/crypto/prices?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cryptocurrency data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching top coins:', error);
      return [];
    }
  }

  async getCoinsBySymbols(symbols: string[]): Promise<CoinData[]> {
    try {
      const response = await fetch(`/api/crypto/prices?symbols=${symbols.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cryptocurrency data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching coins by symbols:', error);
      return [];
    }
  }

  formatPrice(price: number): string {
    if (price < 0.01) {
      return price.toFixed(6);
    } else if (price < 1) {
      return price.toFixed(4);
    } else if (price < 100) {
      return price.toFixed(2);
    } else {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
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
}

export const cryptoService = new CryptoService();