import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoinPrice {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export function RealTimePrices() {
  const [prices, setPrices] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crypto/prices?limit=4');
      if (response.ok) {
        const data = await response.json();
        setPrices(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Update prices every 60 seconds
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number): string => {
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
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-medium">Live Cryptocurrency Prices</CardTitle>
          <CardDescription>
            Last updated: {lastUpdated.toLocaleTimeString()} • Updates every 60 seconds
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPrices}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {prices.map((coin) => (
            <div
              key={coin.id}
              className="flex flex-col p-4 border rounded-lg bg-white dark:bg-gray-50/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-lg">{coin.symbol}</div>
                <Badge
                  variant={coin.change24h >= 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {coin.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-1">{coin.name}</div>
              <div className="font-bold text-xl text-emerald-600">
                ${formatPrice(coin.price)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Market Cap: {formatMarketCap(coin.marketCap)}
              </div>
            </div>
          ))}
        </div>
        {loading && prices.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading cryptocurrency prices...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}