import axios from "axios";

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const COINMARKETCAP_BASE_URL = "https://pro-api.coinmarketcap.com/v1";

export interface CoinData {
  id: number;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
}

export class CoinMarketCapService {
  private apiKey: string;

  constructor() {
    if (!COINMARKETCAP_API_KEY) {
      console.warn("COINMARKETCAP_API_KEY not provided, using mock data");
      this.apiKey = "";
    } else {
      this.apiKey = COINMARKETCAP_API_KEY;
    }
  }

  async getTopCoins(limit: number = 10): Promise<CoinData[]> {
    if (!this.apiKey) {
      // Return mock data when API key is not available
      return [
        { id: 1, name: "Bitcoin", symbol: "BTC", price: 43250.75, change24h: 2.45, marketCap: 847000000000 },
        { id: 1027, name: "Ethereum", symbol: "ETH", price: 2580.32, change24h: -1.23, marketCap: 310000000000 },
        { id: 825, name: "Tether USDt", symbol: "USDT", price: 1.00, change24h: 0.01, marketCap: 96000000000 },
        { id: 1839, name: "BNB", symbol: "BNB", price: 315.67, change24h: 0.85, marketCap: 47000000000 },
        { id: 5426, name: "Solana", symbol: "SOL", price: 102.45, change24h: 3.21, marketCap: 45000000000 },
        { id: 52, name: "XRP", symbol: "XRP", price: 0.62, change24h: -0.85, marketCap: 35000000000 },
        { id: 3408, name: "USDC", symbol: "USDC", price: 1.00, change24h: 0.02, marketCap: 34000000000 },
        { id: 74, name: "Dogecoin", symbol: "DOGE", price: 0.087, change24h: 1.54, marketCap: 12000000000 }
      ].slice(0, limit);
    }

    try {
      const response = await axios.get(`${COINMARKETCAP_BASE_URL}/cryptocurrency/listings/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json',
        },
        params: {
          start: 1,
          limit: limit,
          convert: 'USD',
        },
      });

      return response.data.data.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price: coin.quote.USD.price,
        change24h: coin.quote.USD.percent_change_24h,
        marketCap: coin.quote.USD.market_cap,
      }));
    } catch (error) {
      console.error("Error fetching coin data from CoinMarketCap:", error);
      // Return mock data on error
      return this.getTopCoins(limit);
    }
  }

  async getCoinPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${COINMARKETCAP_BASE_URL}/cryptocurrency/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json',
        },
        params: {
          symbol: symbol.toUpperCase(),
          convert: 'USD',
        },
      });

      const coinData = response.data.data[symbol.toUpperCase()];
      return coinData ? coinData.quote.USD.price : 0;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return 0;
    }
  }

  async getCoinsBySymbols(symbols: string[]): Promise<CoinData[]> {
    try {
      const response = await axios.get(`${COINMARKETCAP_BASE_URL}/cryptocurrency/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json',
        },
        params: {
          symbol: symbols.join(','),
          convert: 'USD',
        },
      });

      return symbols.map(symbol => {
        const coinData = response.data.data[symbol.toUpperCase()];
        if (coinData) {
          return {
            id: coinData.id,
            name: coinData.name,
            symbol: coinData.symbol,
            price: coinData.quote.USD.price,
            change24h: coinData.quote.USD.percent_change_24h,
            marketCap: coinData.quote.USD.market_cap,
          };
        }
        return {
          id: 0,
          name: symbol,
          symbol: symbol.toUpperCase(),
          price: 0,
          change24h: 0,
          marketCap: 0,
        };
      });
    } catch (error) {
      console.error("Error fetching coins by symbols:", error);
      throw new Error("Failed to fetch cryptocurrency data");
    }
  }
}

export const coinMarketCapService = new CoinMarketCapService();