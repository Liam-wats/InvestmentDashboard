import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Loader2, 
  DollarSign, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Coins,
  Copy,
  QrCode
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
import { apiRequest } from "@/lib/queryClient";
import { cryptoFundingSchema, type CryptoFundingData } from "@shared/schema";
import { cryptoService } from "@/lib/crypto";

interface CryptoOption {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  walletAddress: string;
  network?: string;
}

export default function FundAccount() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStep, setTransactionStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);
  const { toast } = useToast();

  // Real-time crypto data
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoOption>>({});
  const [pricesLoading, setPricesLoading] = useState(true);

  const baseCryptoOptions: Omit<CryptoOption, 'price' | 'change24h'>[] = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      icon: "₿",
      walletAddress: "bc1q0uanf2f9px7q5r7maka05mwanutj8gvpqym62g",
      network: "Bitcoin Network"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      icon: "Ξ",
      walletAddress: "0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0",
      network: "Ethereum Mainnet"
    },
    {
      symbol: "USDT",
      name: "Tether USD (ERC-20)",
      icon: "₮",
      walletAddress: "0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0",
      network: "Ethereum Network"
    },
    {
      symbol: "BNB",
      name: "BNB",
      icon: "◊",
      walletAddress: "0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0",
      network: "BNB Smart Chain"
    },
  ];

  // Fetch real-time crypto prices
  const fetchCryptoPrices = async () => {
    setPricesLoading(true);
    try {
      const symbols = baseCryptoOptions.map(crypto => crypto.symbol);
      const priceData = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const response = await fetch(`/api/crypto/price/${symbol}`);
            if (response.ok) {
              const data = await response.json();
              return { symbol, data };
            }
          } catch (error) {
            console.error(`Error fetching ${symbol} price:`, error);
          }
          return null;
        })
      );

      const pricesMap: Record<string, CryptoOption> = {};
      baseCryptoOptions.forEach((base, index) => {
        const priceInfo = priceData[index];
        pricesMap[base.symbol] = {
          ...base,
          price: priceInfo?.data?.quote?.USD?.price || 0,
          change24h: priceInfo?.data?.quote?.USD?.percent_change_24h || 0,
        };
      });

      setCryptoPrices(pricesMap);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Fallback to base options with default prices
      const fallbackPrices: Record<string, CryptoOption> = {};
      baseCryptoOptions.forEach(base => {
        fallbackPrices[base.symbol] = {
          ...base,
          price: base.symbol === 'BTC' ? 43250 : base.symbol === 'ETH' ? 2580 : base.symbol === 'BNB' ? 315 : 1,
          change24h: 0,
        };
      });
      setCryptoPrices(fallbackPrices);
    } finally {
      setPricesLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoPrices();
    
    // Update prices every 60 seconds
    const priceInterval = setInterval(fetchCryptoPrices, 60000);
    return () => clearInterval(priceInterval);
  }, []);

  const cryptoOptions = Object.values(cryptoPrices);

  const form = useForm<CryptoFundingData>({
    resolver: zodResolver(cryptoFundingSchema),
    defaultValues: {
      cryptocurrency: "",
      amount: "",
    },
  });

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth.isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const watchedCrypto = form.watch("cryptocurrency");
  
  useEffect(() => {
    if (watchedCrypto) {
      const crypto = cryptoOptions.find(c => c.symbol === watchedCrypto);
      setSelectedCrypto(crypto || null);
    }
  }, [watchedCrypto]);

  const calculateCryptoAmount = () => {
    const amount = parseFloat(form.watch("amount") || "0");
    if (selectedCrypto && amount > 0 && selectedCrypto.price > 0) {
      const cryptoAmount = amount / selectedCrypto.price;
      return cryptoAmount.toFixed(8);
    }
    return "0";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Wallet address has been copied to your clipboard.",
    });
  };

  const onSubmit = async (data: CryptoFundingData) => {
    if (!selectedCrypto) {
      toast({
        title: "Please select a cryptocurrency",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTransactionStep('processing');
    
    try {
      const auth = getStoredAuth();
      if (!auth.token) {
        throw new Error("Authentication required");
      }

      const response = await fetch('/api/funding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          cryptocurrency: selectedCrypto.symbol,
          amount: parseFloat(data.amount),
          walletAddress: selectedCrypto.walletAddress,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit funding request');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTransactionStep('success');
      toast({
        title: "Funding Request Submitted!",
        description: `Your account will be credited automatically once the blockchain transaction is confirmed.`,
      });

      // Redirect to home after success
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setTransactionStep('error');
      toast({
        title: "Funding Failed",
        description: error instanceof Error ? error.message : "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTransaction = () => {
    setTransactionStep('form');
    setSelectedCrypto(null);
    form.reset();
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
              <h2 className="text-2xl font-bold mb-4">Processing Funding Request</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Your funding request is being processed. Please send the exact amount to the provided wallet address.
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
              <h2 className="text-2xl font-bold mb-4">Funding Request Submitted!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Your funding request has been submitted successfully. Your account will be credited once the transaction is confirmed on the blockchain.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  View Portfolio
                </Button>
                <Button
                  variant="outline"
                  onClick={resetTransaction}
                >
                  Fund Account Again
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
              <h2 className="text-2xl font-bold mb-4">Funding Failed</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                We couldn't process your funding request. Please try again or contact support if the problem persists.
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
            Fund Your Account
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Add funds to your investment account using cryptocurrency
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Crypto Options */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Supported Cryptocurrencies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cryptoOptions.map((crypto) => (
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

          {/* Funding Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Funding Details</CardTitle>
                <CardDescription>
                  Enter the amount you want to add to your account
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
                                {cryptoOptions.map((crypto) => (
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
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Amount (USD)
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
                                ≈ {calculateCryptoAmount()} {selectedCrypto.symbol}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {selectedCrypto && (
                      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-6">
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5" />
                            Send {selectedCrypto.symbol} to this address:
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                Network: {selectedCrypto.network}
                              </p>
                              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                <code className="flex-1 text-sm font-mono break-all">
                                  {selectedCrypto.walletAddress}
                                </code>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(selectedCrypto.walletAddress)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <p>• Send exactly {calculateCryptoAmount()} {selectedCrypto.symbol}</p>
                              <p>• Do not send any other cryptocurrency to this address</p>
                              <p>• Your account will be credited within 10-30 minutes</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {selectedCrypto && form.watch("amount") && (
                      <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">Transaction Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>USD Amount:</span>
                              <span>${parseFloat(form.watch("amount") || "0").toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Crypto Amount:</span>
                              <span>{calculateCryptoAmount()} {selectedCrypto.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Current Rate:</span>
                              <span>${selectedCrypto.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={isLoading || !selectedCrypto || !form.watch("amount")}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Fund Account
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