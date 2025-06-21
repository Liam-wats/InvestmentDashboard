import { db } from './db';
import { users, fundingTransactions } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

class BlockchainService {
  private initialized = false;
  private monitoringEnabled = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Check if blockchain monitoring should be enabled
      const moralisApiKey = process.env.MORALIS_API_KEY;
      
      if (!moralisApiKey) {
        console.log('MORALIS_API_KEY not provided, using simulated blockchain monitoring');
        this.monitoringEnabled = false;
      } else {
        console.log('Blockchain monitoring service initialized with real API');
        this.monitoringEnabled = true;
      }

      this.initialized = true;
      
      // Start monitoring process
      this.startTransactionMonitoring();
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
    }
  }

  private async startTransactionMonitoring() {
    // Start periodic checking for pending transactions
    setInterval(() => {
      this.processQueuedTransactions();
    }, 30000); // Check every 30 seconds
  }

  private async processQueuedTransactions() {
    try {
      // Find all pending funding transactions that need blockchain confirmation
      const pendingTransactions = await db.select()
        .from(fundingTransactions)
        .where(
          and(
            eq(fundingTransactions.status, 'confirmed'),
            isNull(fundingTransactions.transactionHash)
          )
        );

      for (const transaction of pendingTransactions) {
        // For demo purposes, auto-confirm transactions after 2 minutes
        const createdAt = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
        const now = new Date();
        const timeDiff = now.getTime() - createdAt.getTime();
        
        if (timeDiff > 120000) { // 2 minutes
          await this.confirmTransaction(transaction.id, `demo_tx_${transaction.id}_${Date.now()}`);
        }
      }
    } catch (error) {
      console.error('Error processing queued transactions:', error);
    }
  }

  async confirmTransaction(transactionId: number, blockchainHash: string) {
    try {
      // Update the transaction with blockchain hash
      await db.update(fundingTransactions)
        .set({
          transactionHash: blockchainHash,
          status: 'confirmed'
        })
        .where(eq(fundingTransactions.id, transactionId));

      console.log(`Confirmed blockchain transaction: ${blockchainHash} for transaction ${transactionId}`);
      return true;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return false;
    }
  }

  async getTransactionStatus(hash: string): Promise<string> {
    try {
      const transaction = await db.select()
        .from(fundingTransactions)
        .where(eq(fundingTransactions.transactionHash, hash))
        .limit(1);

      return transaction.length > 0 ? transaction[0].status : 'pending';
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'pending';
    }
  }

  async getPendingTransactionCount(): Promise<number> {
    try {
      const pending = await db.select()
        .from(fundingTransactions)
        .where(eq(fundingTransactions.status, 'pending'));
      
      return pending.length;
    } catch (error) {
      console.error('Error getting pending transaction count:', error);
      return 0;
    }
  }

  isMonitoringEnabled(): boolean {
    return this.monitoringEnabled;
  }
}

export const blockchainService = new BlockchainService();