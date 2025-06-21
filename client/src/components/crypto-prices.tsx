import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cryptoService, type CoinData } from "@/lib/crypto";

export function CryptoPrices() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchCoinData = async () => {
    setLoading(true);
    try {
      const coinData = await cryptoService.getTopCoins(8);
      setCoins(coinData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoinData();
    
    // Auto-update every 5 minutes
    const interval = setInterval(fetchCoinData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-medium">Real-Time Crypto Prices</CardTitle>
          <CardDescription>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCoinData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex flex-col">
                <div className="font-medium text-sm">{coin.symbol}</div>
                <div className="text-xs text-muted-foreground">{coin.name}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="font-medium text-sm">
                  ${cryptoService.formatPrice(coin.price)}
                </div>
                <Badge
                  variant={coin.change24h >= 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {coin.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {cryptoService.formatChange(coin.change24h)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        {loading && (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading crypto prices...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}