import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Bitcoin, 
  Loader2, 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getStoredAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const cryptoSchema = z.object({
  cryptocurrency: z.string().min(1, "Please select a cryptocurrency"),
  investmentAmount: z.string().min(1, "Investment amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Must be a valid positive number"
  ),
  walletAddress: z.string().min(26, "Please enter a valid wallet address"),
  stockSymbol: z.string().min(1, "Please select a stock to purchase"),
});

type CryptoFormData = z.infer<typeof cryptoSchema>;

interface CryptoRate {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

export default function BuyCrypto() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStep, setTransactionStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [cryptoRates, setCryptoRates] = useState<CryptoRate[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoRate | null>(null);
  const { toast } = useToast();

  const form = useForm<CryptoFormData>({
    resolver: zodResolver(cryptoSchema),
    defaultValues: {
      cryptocurrency: "",
      investmentAmount: "",
      walletAddress: "",
      stockSymbol: "",
    },
  });

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth.isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load crypto rates (mock data with realistic prices)
    setCryptoRates([
      {
        symbol: "BTC",
        name: "Bitcoin",
        price: 43250.75,
        change24h: 2.45,
        icon: "₿"
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        price: 2580.32,
        change24h: -1.23,
        icon: "Ξ"
      },
      {
        symbol: "BNB",
        name: "Binance Coin",
        price: 315.67,
        change24h: 0.85,
        icon: "◊"
      },
      {
        symbol: "ADA",
        name: "Cardano",
        price: 0.52,
        change24h: 3.21,
        icon: "₳"
      },
      {
        symbol: "SOL",
        name: "Solana",
        price: 98.45,
        change24h: 4.67,
        icon: "◎"
      },
    ]);
  }, [navigate]);

  const watchedCrypto = form.watch("cryptocurrency");
  
  useEffect(() => {
    if (watchedCrypto) {
      const crypto = cryptoRates.find(c => c.symbol === watchedCrypto);
      setSelectedCrypto(crypto || null);
    }
  }, [watchedCrypto, cryptoRates]);

  const calculateSharesAmount = () => {
    const amount = parseFloat(form.watch("investmentAmount") || "0");
    if (selectedCrypto && amount > 0) {
      return (amount / selectedCrypto.price).toFixed(6);
    }
    return "0";
  };

  const onSubmit = async (data: CryptoFormData) => {
    setIsLoading(true);
    setTransactionStep('processing');
    
    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure (90% success rate)
      if (Math.random() > 0.1) {
        setTransactionStep('success');
        toast({
          title: "Transaction Successful!",
          description: `Your ${data.stockSymbol} shares have been purchased with ${selectedCrypto?.name}.`,
        });
      } else {
        setTransactionStep('error');
        toast({
          title: "Transaction Failed",
          description: "Please check your wallet balance and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTransactionStep('error');
      toast({
        title: "Transaction Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTransaction = () => {
    setTransactionStep('form');
    form.reset();
    setSelectedCrypto(null);
  };

  if (transactionStep === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Processing Transaction</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Your crypto transaction is being processed. Please don't close this window.
              </p>
              <Progress value={66} className="w-full mb-4" />
              <p className="text-sm text-gray-500">This may take a few minutes...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (transactionStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Transaction Successful!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Your investment has been processed successfully. You should see the shares in your portfolio shortly.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  View Portfolio
                </Button>
                <Button
                  variant="outline"
                  onClick={resetTransaction}
                >
                  Make Another Investment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (transactionStep === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Transaction Failed</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                We couldn't process your transaction. Please check your wallet balance and try again.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={resetTransaction}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Buy Shares with Cryptocurrency
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Use your cryptocurrency to purchase stocks and ETFs directly
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Crypto Rates */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Live Crypto Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cryptoRates.map((crypto) => (
                  <div
                    key={crypto.symbol}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedCrypto?.symbol === crypto.symbol
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => form.setValue("cryptocurrency", crypto.symbol)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{crypto.icon}</span>
                        <div>
                          <p className="font-semibold">{crypto.symbol}</p>
                          <p className="text-sm text-gray-500">{crypto.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">${crypto.price.toLocaleString()}</span>
                      <Badge variant={crypto.change24h >= 0 ? "default" : "destructive"}>
                        {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Purchase Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Investment Details</CardTitle>
                <CardDescription>
                  Enter your investment amount and wallet details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cryptocurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cryptocurrency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select cryptocurrency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cryptoRates.map((crypto) => (
                                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                                    {crypto.icon} {crypto.name} ({crypto.symbol})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stockSymbol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock to Purchase</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select stock" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AAPL">Apple Inc. (AAPL)</SelectItem>
                                <SelectItem value="GOOGL">Alphabet Inc. (GOOGL)</SelectItem>
                                <SelectItem value="MSFT">Microsoft Corp. (MSFT)</SelectItem>
                                <SelectItem value="TSLA">Tesla Inc. (TSLA)</SelectItem>
                                <SelectItem value="VTI">Vanguard Total Stock Market ETF (VTI)</SelectItem>
                                <SelectItem value="SPY">SPDR S&P 500 ETF (SPY)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="investmentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Investment Amount (USD)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter amount in USD"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          {selectedCrypto && field.value && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              ≈ {calculateSharesAmount()} {selectedCrypto.symbol}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="walletAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            Wallet Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your wallet address"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedCrypto && form.watch("investmentAmount") && (
                      <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">Transaction Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Investment Amount:</span>
                              <span>${parseFloat(form.watch("investmentAmount") || "0").toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Crypto Amount:</span>
                              <span>{calculateSharesAmount()} {selectedCrypto.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Current Rate:</span>
                              <span>${selectedCrypto.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>Stock to Purchase:</span>
                              <span>{form.watch("stockSymbol") || "Not selected"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Transaction...
                        </>
                      ) : (
                        <>
                          Confirm Purchase
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}