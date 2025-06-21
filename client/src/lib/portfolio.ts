import { authService } from './auth';

export interface Portfolio {
  user: {
    id: number;
    email: string;
    name: string;
    totalInvested: string;
    currentBalance: string;
    dailyRoi: string;
    lastRoiUpdate: string;
  };
  investments: Investment[];
  fundingTransactions: FundingTransaction[];
}

export interface Investment {
  id: number;
  userId: number;
  symbol: string;
  name: string;
  shares: string;
  purchasePrice: string;
  currentPrice: string;
  type: string;
  createdAt: string;
}

export interface FundingTransaction {
  id: number;
  userId: number;
  cryptocurrency: string;
  amount: string;
  walletAddress: string;
  transactionHash?: string;
  status: string;
  createdAt?: string;
}

class PortfolioService {
  async getPortfolio(): Promise<Portfolio> {
    try {
      const response = await authService.fetchWithAuth('/api/portfolio');
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  async createFundingTransaction(data: {
    cryptocurrency: string;
    amount: string;
    walletAddress: string;
  }): Promise<FundingTransaction> {
    try {
      const response = await authService.fetchWithAuth('/api/funding-transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create funding transaction');
      }

      const result = await response.json();
      return result.transaction;
    } catch (error) {
      console.error('Error creating funding transaction:', error);
      throw error;
    }
  }

  async getUserProfile() {
    try {
      const response = await authService.fetchWithAuth('/api/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  formatPercentage(percentage: string | number): string {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    return `${num.toFixed(2)}%`;
  }

  calculateROI(totalInvested: number, currentBalance: number): number {
    if (totalInvested === 0) return 0;
    return ((currentBalance - totalInvested) / totalInvested) * 100;
  }
}

export const portfolioService = new PortfolioService();

export function calculatePortfolioAllocation(portfolioValue: number) {
  // Simulate portfolio allocation for display
  if (portfolioValue === 0) {
    return {
      stock: 0,
      etf: 0,
      bond: 0,
      cash: 100
    };
  }

  return {
    stock: 45,
    etf: 30,
    bond: 15,
    cash: 10
  };
}