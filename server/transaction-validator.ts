// Transaction validation service to prevent fake funding
import { db } from './db';
import { fundingTransactions, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { priceOracleService } from './price-oracle';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  actualAmount?: number;
  expectedAmount?: number;
}

export class TransactionValidator {
  
  async validateTransaction(
    transactionHash: string,
    walletAddress: string,
    amount: string,
    cryptocurrency: string
  ): Promise<ValidationResult> {
    
    // Find the corresponding funding transaction
    const fundingTx = await db.select()
      .from(fundingTransactions)
      .where(
        and(
          eq(fundingTransactions.walletAddress, walletAddress),
          eq(fundingTransactions.status, 'pending')
        )
      )
      .limit(1);

    if (fundingTx.length === 0) {
      return {
        isValid: false,
        reason: 'No pending funding transaction found for this wallet address'
      };
    }

    const transaction = fundingTx[0];
    const expectedAmount = parseFloat(transaction.amount);
    
    // Convert received amount to USD based on cryptocurrency
    let actualAmount: number;
    
    try {
      switch (cryptocurrency.toUpperCase()) {
        case 'ETH':
          actualAmount = await priceOracleService.convertWeiToUSD(amount);
          break;
        case 'BTC':
          actualAmount = await priceOracleService.convertSatoshiToUSD(amount);
          break;
        case 'USDT':
        case 'USDC':
          // Assuming amount is already in USD for stablecoins
          actualAmount = parseFloat(amount);
          break;
        default:
          const price = await priceOracleService.getPrice(cryptocurrency);
          actualAmount = parseFloat(amount) * price;
      }
    } catch (error) {
      return {
        isValid: false,
        reason: `Failed to convert ${cryptocurrency} amount to USD`,
        actualAmount: 0,
        expectedAmount
      };
    }

    // Allow 5% tolerance for price fluctuations and gas fees
    const tolerance = 0.05;
    const minAmount = expectedAmount * (1 - tolerance);
    const maxAmount = expectedAmount * (1 + tolerance);

    if (actualAmount < minAmount) {
      return {
        isValid: false,
        reason: `Insufficient amount received. Expected ~$${expectedAmount}, got $${actualAmount.toFixed(2)}`,
        actualAmount,
        expectedAmount
      };
    }

    if (actualAmount > maxAmount) {
      return {
        isValid: false,
        reason: `Amount too large. Expected ~$${expectedAmount}, got $${actualAmount.toFixed(2)}`,
        actualAmount,
        expectedAmount
      };
    }

    return {
      isValid: true,
      actualAmount,
      expectedAmount
    };
  }

  async preventDuplicateProcessing(transactionHash: string): Promise<boolean> {
    const existing = await db.select()
      .from(fundingTransactions)
      .where(eq(fundingTransactions.transactionHash, transactionHash))
      .limit(1);

    return existing.length > 0;
  }

  async validateUserEligibility(userId: number): Promise<boolean> {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return false;
    }

    // Add additional validation rules here if needed
    // For example: KYC verification, account limits, etc.
    return user[0].isVerified || false;
  }
}

export const transactionValidator = new TransactionValidator();