import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/navigation";
import { CryptoPrices } from "@/components/crypto-prices";
import { TrendingUp, TrendingDown, DollarSign, Target, PieChart, ArrowUpRight, Wallet, CreditCard, Building, Banknote, Shield, Clock } from "lucide-react";
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, Pie, Tooltip } from "recharts";
import { authService } from "@/lib/auth";
import { portfolioService, type Portfolio } from "@/lib/portfolio";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const { data: portfolioData, isLoading: portfolioLoading, error: portfolioError, refetch } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => portfolioService.getPortfolio(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (portfolioLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (portfolioError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">Error loading portfolio data</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const portfolio = portfolioData || {
    user: {
      id: 0,
      email: '',
      name: '',
      totalInvested: '0',
      currentBalance: '0',
      dailyRoi: '0',
      lastRoiUpdate: new Date().toISOString()
    },
    investments: [],
    fundingTransactions: []
  };

  const totalInvested = parseFloat(portfolio.user.totalInvested);
  const currentBalance = parseFloat(portfolio.user.currentBalance);
  const dailyRoi = parseFloat(portfolio.user.dailyRoi);
  const profit = currentBalance - totalInvested;
  const roiPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
  
  const pieData = [
    { name: 'Growth', value: Math.max(0, profit), color: '#10B981' },
    { name: 'Principal', value: totalInvested, color: '#3B82F6' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto">
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Here's an overview of your investment portfolio with dynamic ROI system
                </p>
              </div>
              <Button 
                onClick={() => navigate('/fund-account')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 font-semibold"
              >
                Fund Account
              </Button>
            </div>

            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold text-emerald-600">
                    {portfolioService.formatCurrency(currentBalance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Growing at {portfolioService.formatPercentage(dailyRoi)} daily
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {portfolioService.formatCurrency(totalInvested)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Principal amount invested
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                  {profit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolioService.formatCurrency(Math.abs(profit))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profit >= 0 ? 'Profit' : 'Loss'} from ROI growth
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily ROI Rate</CardTitle>
                  <Shield className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {portfolioService.formatPercentage(dailyRoi)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on investment tier
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ROI Information Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Dynamic ROI System
                </CardTitle>
                <CardDescription>
                  Your daily ROI rate is calculated based on your total investment amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">$100 - $500</h4>
                    <p className="text-lg font-bold text-emerald-600">1.5% Daily</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">$600 - $1,000</h4>
                    <p className="text-lg font-bold text-emerald-600">2.5% Daily</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">$1,000+</h4>
                    <p className="text-lg font-bold text-emerald-600">Up to 15% Daily</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  ROI increases by 1% for each $1,000 investment tier, capped at $500,000 and 15% daily.
                  Last ROI update: {new Date(portfolio.user.lastRoiUpdate).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Real-time Crypto Prices */}
            <CryptoPrices />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
              {/* Portfolio Growth Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Composition</CardTitle>
                  <CardDescription>Breakdown of your investment portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${portfolioService.formatCurrency(value)}`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => portfolioService.formatCurrency(value as number)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}: {portfolioService.formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ROI Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>ROI Progress</CardTitle>
                  <CardDescription>Your return on investment performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall ROI</span>
                        <span className="text-sm font-medium">{portfolioService.formatPercentage(roiPercentage)}</span>
                      </div>
                      <Progress value={Math.min(Math.abs(roiPercentage), 100)} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Daily Growth Rate</span>
                        <span className="text-sm font-medium">{portfolioService.formatPercentage(dailyRoi)}</span>
                      </div>
                      <Progress value={(dailyRoi / 15) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Maximum: 15% daily</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Next ROI Tier</h4>
                      <p className="text-xs text-muted-foreground">
                        Invest {portfolioService.formatCurrency(Math.max(0, Math.ceil(totalInvested / 1000) * 1000 - totalInvested))} more to unlock the next ROI rate!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Funding Transactions</CardTitle>
                  <CardDescription>Your latest account funding activities</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/fund-account')}>
                  Add Funds
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.fundingTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={transaction.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.cryptocurrency} Deposit</p>
                          <p className="text-sm text-gray-500">
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {transaction.walletAddress.substring(0, 10)}...{transaction.walletAddress.substring(transaction.walletAddress.length - 4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +{portfolioService.formatCurrency(parseFloat(transaction.amount))}
                        </p>
                        <Badge 
                          variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {portfolio.fundingTransactions.length === 0 && (
                    <div className="text-center py-8">
                      <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Start by funding your account to begin earning daily ROI
                      </p>
                      <Button onClick={() => navigate('/fund-account')} className="bg-emerald-600 hover:bg-emerald-700">
                        Fund Account
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}