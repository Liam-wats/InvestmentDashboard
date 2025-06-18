import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Plus, 
  Minus, 
  Menu, 
  X,
  PieChart,
  Activity,
  Settings,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getStoredAuth } from "@/lib/auth";
import { 
  getStoredInvestments, 
  getStoredActivities, 
  calculatePortfolioStats, 
  getPortfolioAllocation 
} from "@/lib/storage";
import type { Investment, Activity } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartInstance, setChartInstance] = useState<any>(null);

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth.isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load data
    setInvestments(getStoredInvestments());
    setActivities(getStoredActivities());
  }, [navigate]);

  useEffect(() => {
    // Initialize chart when investments change
    if (investments.length > 0) {
      initializeChart();
    }

    return () => {
      // Cleanup chart on unmount
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [investments]);

  const auth = getStoredAuth();
  const stats = calculatePortfolioStats(investments);
  const allocation = getPortfolioAllocation(investments);

  const initializeChart = () => {
    const canvas = document.getElementById('portfolioChart') as HTMLCanvasElement;
    if (!canvas || !window.Chart) return;

    // Destroy existing chart
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newChart = new (window as any).Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Stocks', 'ETFs', 'Bonds', 'Cash'],
        datasets: [{
          data: [
            allocation.stock,
            allocation.etf,
            allocation.bond,
            allocation.cash
          ],
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#8b5cf6',
            '#f59e0b'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        cutout: '70%'
      }
    });

    setChartInstance(newChart);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else {
      return 'Just now';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <Plus className="w-5 h-5 text-emerald-500" />;
      case 'sell':
        return <Minus className="w-5 h-5 text-red-500" />;
      case 'dividend':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default:
        return <BarChart3 className="w-5 h-5 text-purple-500" />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
      
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
          >
            <Home className="mr-3 h-5 w-5" />
            Portfolio
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <TrendingUp className="mr-3 h-5 w-5" />
            Investments
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <BarChart3 className="mr-3 h-5 w-5" />
            Analytics
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Button>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-white lg:dark:bg-gray-800 lg:shadow-lg lg:pt-16">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <div></div>
        </div>

        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {auth.user?.name}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Here's how your investments are performing today.
            </p>
          </div>

          {/* Investment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Invested
                  </h3>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatCurrency(stats.totalInvested)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Since January 2024
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Current Value
                  </h3>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatCurrency(stats.currentValue)}
                </p>
                <p className="text-sm text-emerald-500 font-medium">
                  +{formatCurrency(stats.profit)} this year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total ROI
                  </h3>
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-emerald-500 mb-2">
                  +{stats.roi.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Above market average
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Portfolio Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Portfolio Allocation
                  <Button variant="ghost" size="icon">
                    <PieChart className="w-5 h-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 mb-6">
                  <canvas id="portfolioChart"></canvas>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Stocks ({allocation.stock.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      ETFs ({allocation.etf.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Bonds ({allocation.bond.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Cash ({allocation.cash.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Activity
                  <Button variant="link" className="text-emerald-500 hover:text-emerald-600">
                    View all
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activity.type === 'dividend' ? 'Dividend Received' : 
                             activity.type === 'buy' ? `Bought ${activity.symbol}` :
                             `Sold ${activity.symbol}`}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.shares && `${activity.shares} shares • `}
                            {formatTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        parseFloat(activity.amount) > 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {parseFloat(activity.amount) > 0 ? '+' : ''}
                        {formatCurrency(parseFloat(activity.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Buy More Shares CTA */}
          <Card className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to invest more?</h3>
              <p className="text-emerald-100 mb-6">
                Continue building your wealth with smart investment choices.
              </p>
              <Button 
                size="lg"
                className="bg-white text-emerald-600 hover:text-emerald-700 hover:bg-gray-50"
              >
                Buy More Shares
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
