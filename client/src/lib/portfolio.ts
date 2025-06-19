import { apiRequest } from "./queryClient";

export interface PortfolioData {
  totalInvested: number;
  currentValue: number;
  roi: number;
  profit: number;
  transactions: any[];
}

export async function fetchPortfolioData(userId: number): Promise<PortfolioData> {
  try {
    const response = await fetch(`/api/users/${userId}/funding-transactions`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // No transactions yet, return empty portfolio
        return {
          totalInvested: 0,
          currentValue: 0,
          roi: 0,
          profit: 0,
          transactions: []
        };
      }
      throw new Error('Failed to fetch portfolio data');
    }
    
    const transactions = await response.json();
    
    // Calculate portfolio based on funding transactions with 3% daily growth
    let totalInvested = 0;
    let currentValue = 0;
    
    transactions.forEach((transaction: any) => {
      if (transaction.status === 'completed') {
        const investedAmount = transaction.amount;
        totalInvested += investedAmount;
        
        // Calculate days since funding
        const fundingDate = new Date(transaction.createdAt);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate.getTime() - fundingDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Apply 3% daily compound growth
        const growthFactor = Math.pow(1.03, daysDiff);
        currentValue += investedAmount * growthFactor;
      }
    });
    
    const profit = currentValue - totalInvested;
    const roi = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    
    return {
      totalInvested,
      currentValue,
      roi,
      profit,
      transactions
    };
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    // Return empty portfolio on error
    return {
      totalInvested: 0,
      currentValue: 0,
      roi: 0,
      profit: 0,
      transactions: []
    };
  }
}

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