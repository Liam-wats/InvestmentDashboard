import { Investment, Activity } from "@shared/schema";

const INVESTMENTS_KEY = "investwise_investments";
const ACTIVITIES_KEY = "investwise_activities";

export function getStoredInvestments(): Investment[] {
  try {
    const stored = localStorage.getItem(INVESTMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error parsing stored investments:", error);
  }
  
  // Return demo data if nothing stored
  return [
    {
      id: 1,
      userId: 1,
      symbol: "AAPL",
      name: "Apple Inc.",
      shares: "10.0000",
      purchasePrice: "175.00",
      currentPrice: "185.00",
      type: "stock",
      createdAt: new Date(),
    },
    {
      id: 2,
      userId: 1,
      symbol: "VTI",
      name: "Vanguard Total Stock Market ETF",
      shares: "25.0000",
      purchasePrice: "220.00",
      currentPrice: "235.00",
      type: "etf",
      createdAt: new Date(),
    },
    {
      id: 3,
      userId: 1,
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      shares: "5.0000",
      purchasePrice: "140.00",
      currentPrice: "155.00",
      type: "stock",
      createdAt: new Date(),
    },
  ];
}

export function getStoredActivities(): Activity[] {
  try {
    const stored = localStorage.getItem(ACTIVITIES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error parsing stored activities:", error);
  }
  
  // Return demo data if nothing stored
  return [
    {
      id: 1,
      userId: 1,
      type: "buy",
      symbol: "AAPL",
      name: "Apple Inc.",
      amount: "1750.00",
      shares: "10.0000",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 2,
      userId: 1,
      type: "dividend",
      symbol: "MSFT",
      name: "Microsoft Corporation",
      amount: "45.20",
      shares: null,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 3,
      userId: 1,
      type: "buy",
      symbol: "VTI",
      name: "Vanguard Total Stock Market ETF",
      amount: "1200.00",
      shares: "5.0000",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      id: 4,
      userId: 1,
      type: "sell",
      symbol: "TSLA",
      name: "Tesla Inc.",
      amount: "-950.00",
      shares: "3.0000",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
    {
      id: 5,
      userId: 1,
      type: "buy",
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      amount: "2800.00",
      shares: "2.0000",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
  ];
}

export function calculatePortfolioStats(investments: Investment[]) {
  let totalInvested = 0;
  let currentValue = 0;
  
  investments.forEach(investment => {
    const shares = parseFloat(investment.shares);
    const purchasePrice = parseFloat(investment.purchasePrice);
    const currentPrice = parseFloat(investment.currentPrice);
    
    totalInvested += shares * purchasePrice;
    currentValue += shares * currentPrice;
  });
  
  const roi = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  
  return {
    totalInvested,
    currentValue,
    roi,
    profit: currentValue - totalInvested,
  };
}

export function getPortfolioAllocation(investments: Investment[]) {
  const allocation = {
    stock: 0,
    etf: 0,
    bond: 0,
    cash: 0,
  };
  
  let totalValue = 0;
  
  investments.forEach(investment => {
    const shares = parseFloat(investment.shares);
    const currentPrice = parseFloat(investment.currentPrice);
    const value = shares * currentPrice;
    
    allocation[investment.type as keyof typeof allocation] += value;
    totalValue += value;
  });
  
  // Convert to percentages
  Object.keys(allocation).forEach(key => {
    allocation[key as keyof typeof allocation] = totalValue > 0 ? 
      (allocation[key as keyof typeof allocation] / totalValue) * 100 : 0;
  });
  
  return allocation;
}
