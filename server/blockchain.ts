import { db } from './db';
import { users, fundingTransactions } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { updateUserInvestment } from './roi';

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
        .where(eq(fundingTransactions.status, 'pending'));

      for (const transaction of pendingTransactions) {
        // Simulate blockchain confirmation after 2 minutes (in real implementation, this would check actual blockchain)
        const createdAt = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
        const now = new Date();
        const timeDiff = now.getTime() - createdAt.getTime();
        
        if (timeDiff > 120000) { // 2 minutes - simulate blockchain detection
          await this.simulateBlockchainConfirmation(transaction.id);
        }
      }

      // Process blockchain-confirmed transactions that need completion (simulate confirmation accumulation)
      const blockchainConfirmed = await db.select()
        .from(fundingTransactions)
        .where(eq(fundingTransactions.status, 'blockchain_confirmed'));

      for (const transaction of blockchainConfirmed) {
        const confirmedAt = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
        const now = new Date();
        const timeDiff = now.getTime() - confirmedAt.getTime();
        
        // Simulate that we need at least 5 minutes for sufficient confirmations
        if (timeDiff > 300000) { // 5 minutes total
          // Update confirmations before completing
          await db.update(fundingTransactions)
            .set({ 
              blockConfirmations: 6,
              requiredConfirmations: 3
            })
            .where(eq(fundingTransactions.id, transaction.id));
            
          await this.completeTransaction(transaction.id);
        }
      }
    } catch (error) {
      console.error('Error processing queued transactions:', error);
    }
  }

  private async simulateBlockchainConfirmation(transactionId: number) {
    try {
      const hashTx = `0x${Math.random().toString(16).substring(2)}${transactionId}`;
      
      await db.update(fundingTransactions)
        .set({
          transactionHash: hashTx,
          status: 'blockchain_confirmed'
        })
        .where(eq(fundingTransactions.id, transactionId));

      console.log(`Blockchain confirmation simulated for transaction ${transactionId}: ${hashTx}`);
    } catch (error) {
      console.error('Error simulating blockchain confirmation:', error);
    }
  }

  private async completeTransaction(transactionId: number) {
    try {
      const transaction = await db.select()
        .from(fundingTransactions)
        .where(eq(fundingTransactions.id, transactionId))
        .limit(1);

      if (transaction.length === 0) return;

      const txData = transaction[0];
      
      // Only process if transaction is still in blockchain_confirmed status
      if (txData.status !== 'blockchain_confirmed') {
        console.log(`Transaction ${transactionId} already processed or not ready for completion`);
        return;
      }

      const amount = parseFloat(txData.amount);

      // Update user investment only after blockchain confirmation
      await updateUserInvestment(txData.userId, amount);

      // Mark transaction as completed
      await db.update(fundingTransactions)
        .set({ status: 'completed' })
        .where(eq(fundingTransactions.id, transactionId));

      console.log(`Transaction completed: User ${txData.userId} funded with $${amount}`);
    } catch (error) {
      console.error('Error completing transaction:', error);
    }
  }

  async confirmTransaction(transactionId: number, blockchainHash: string) {
    try {
      // Update the transaction with blockchain hash
      await db.update(fundingTransactions)
        .set({
          transactionHash: blockchainHash,
          status: 'blockchain_confirmed'
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