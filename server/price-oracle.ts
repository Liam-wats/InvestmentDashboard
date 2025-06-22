// Price oracle service for accurate crypto-to-USD conversions
import { coinMarketCapService } from './coinmarket';

interface PriceData {
  symbol: string;
  price: number;
  lastUpdated: number;
}

class PriceOracleService {
  private priceCache: Map<string, PriceData> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  async getPrice(symbol: string): Promise<number> {
    const cached = this.priceCache.get(symbol);
    
    if (cached && Date.now() - cached.lastUpdated < this.CACHE_DURATION) {
      return cached.price;
    }

    try {
      // Fetch fresh price data
      const cryptoData = await coinMarketCapService.getCoinsBySymbols([symbol]);
      const coin = cryptoData.find(c => c.symbol === symbol);
      
      if (!coin) {
        throw new Error(`Price not found for ${symbol}`);
      }

      const priceData: PriceData = {
        symbol,
        price: coin.currentPrice,
        lastUpdated: Date.now()
      };

      this.priceCache.set(symbol, priceData);
      return coin.currentPrice;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      
      // Fallback to cached price if available
      if (cached) {
        console.log(`Using stale price for ${symbol}: $${cached.price}`);
        return cached.price;
      }
      
      // Hard-coded fallback prices (for emergency use only)
      const fallbackPrices: Record<string, number> = {
        'BTC': 43000,
        'ETH': 2500,
        'BNB': 300,
        'USDT': 1
      };
      
      return fallbackPrices[symbol] || 0;
    }
  }

  convertCryptoToUSD(amount: number, symbol: string, price?: number): number {
    if (price) {
      return amount * price;
    }
    
    // Use cached price if available
    const cached = this.priceCache.get(symbol);
    if (cached) {
      return amount * cached.price;
    }
    
    return 0; // Cannot convert without price data
  }

  // Convert Wei to ETH and then to USD
  async convertWeiToUSD(weiValue: string): Promise<number> {
    const ethAmount = parseFloat(weiValue) / Math.pow(10, 18);
    const ethPrice = await this.getPrice('ETH');
    return ethAmount * ethPrice;
  }

  // Convert satoshis to BTC and then to USD
  async convertSatoshiToUSD(satoshiValue: string): Promise<number> {
    const btcAmount = parseFloat(satoshiValue) / Math.pow(10, 8);
    const btcPrice = await this.getPrice('BTC');
    return btcAmount * btcPrice;
  }
}

export const priceOracleService = new PriceOracleService();