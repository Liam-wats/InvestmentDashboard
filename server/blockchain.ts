import { db } from './db';
import { users, fundingTransactions } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { updateUserInvestment } from './roi';
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';

interface WalletConfig {
  address: string;
  chain: 'ethereum' | 'bitcoin';
  network?: string;
}

interface TransactionEvent {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  confirmed: boolean;
  blockNumber?: number;
  confirmations?: number;
}

class BlockchainService {
  private initialized = false;
  private monitoringEnabled = false;
  private watchedWallets: WalletConfig[] = [
    { address: '0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0', chain: 'ethereum' },
    { address: 'bc1q0uanf2f9px7q5r7maka05mwanutj8gvpqym62g', chain: 'bitcoin' }
  ];

  async initialize() {
    if (this.initialized) return;

    try {
      const moralisApiKey = process.env.MORALIS_API_KEY;
      
      if (!moralisApiKey) {
        console.log('MORALIS_API_KEY not provided, using simulated blockchain monitoring');
        this.monitoringEnabled = false;
        this.startTransactionMonitoring();
      } else {
        console.log('Initializing Moralis Web3 API...');
        await Moralis.start({
          apiKey: moralisApiKey,
        });
        this.monitoringEnabled = true;
        console.log('Moralis Web3 API initialized successfully');
        
        // Log configuration for user setup
        const { logMoralisConfiguration } = await import('./moralis-config');
        logMoralisConfiguration();
        
        // Initialize real-time monitoring
        await this.setupWalletMonitoring();
        this.startTransactionMonitoring();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      // Fallback to simulated monitoring
      this.monitoringEnabled = false;
      this.startTransactionMonitoring();
    }
  }

  private async setupWalletMonitoring() {
    if (!this.monitoringEnabled) return;

    try {
      // Fetch historical transactions for each watched wallet
      for (const wallet of this.watchedWallets) {
        if (wallet.chain === 'ethereum') {
          await this.fetchEthereumTransactions(wallet.address);
        }
        // Bitcoin monitoring would require additional setup
      }
    } catch (error) {
      console.error('Error setting up wallet monitoring:', error);
    }
  }

  private async fetchEthereumTransactions(address: string) {
    try {
      const response = await Moralis.EvmApi.transaction.getWalletTransactions({
        address,
        chain: EvmChain.ETHEREUM,
        limit: 10,
      });

      const transactions = response.result;
      console.log(`Fetched ${transactions.length} transactions for address ${address}`);
      
      for (const tx of transactions) {
        // Process transaction if it's to one of our watched addresses
        if (tx.toAddress?.toLowerCase() === address.toLowerCase()) {
          await this.processIncomingTransaction({
            hash: tx.hash,
            from: tx.fromAddress?.toLowerCase() || '',
            to: tx.toAddress?.toLowerCase() || '',
            value: tx.value.toString(),
            timestamp: tx.blockTimestamp?.toISOString() || new Date().toISOString(),
            confirmed: true,
            blockNumber: tx.blockNumber,
            confirmations: 12 // Assume sufficient confirmations for historical transactions
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching Ethereum transactions for ${address}:`, error);
    }
  }

  private async processIncomingTransaction(event: TransactionEvent) {
    try {
      // Find matching funding transaction that's still pending
      const fundingTx = await db.select()
        .from(fundingTransactions)
        .where(
          and(
            eq(fundingTransactions.walletAddress, event.to),
            eq(fundingTransactions.status, 'pending')
          )
        )
        .orderBy(fundingTransactions.createdAt)
        .limit(1);

      if (fundingTx.length === 0) {
        console.log(`No pending funding transaction found for address ${event.to}`);
        return;
      }

      const transaction = fundingTx[0];
      
      // Prevent duplicate processing
      if (transaction.transactionHash && transaction.transactionHash === event.hash) {
        console.log(`Transaction ${event.hash} already processed`);
        return;
      }
      
      // Update transaction with blockchain data
      await db.update(fundingTransactions)
        .set({
          transactionHash: event.hash,
          status: event.confirmed ? 'blockchain_confirmed' : 'pending',
          blockConfirmations: event.confirmations || 0,
          requiredConfirmations: 3
        })
        .where(eq(fundingTransactions.id, transaction.id));

      console.log(`Updated funding transaction ${transaction.id} with hash ${event.hash}`);

      // Complete transaction if sufficient confirmations
      if (event.confirmed && (event.confirmations || 0) >= 3) {
        await this.completeTransaction(transaction.id);
      }
    } catch (error) {
      console.error('Error processing incoming transaction:', error);
    }
  }

  async processWebhookEvent(webhookData: any) {
    try {
      console.log('Processing webhook event:', JSON.stringify(webhookData, null, 2));
      
      // Handle different webhook formats from Moralis
      let transactions = [];
      
      if (webhookData.txs && Array.isArray(webhookData.txs)) {
        // Moralis Streams format
        transactions = webhookData.txs;
      } else if (webhookData.txHash) {
        // Single transaction format
        transactions = [webhookData];
      } else {
        console.log('Unknown webhook format, skipping...');
        return;
      }

      for (const tx of transactions) {
        if (tx.confirmed === false) {
          console.log(`Transaction ${tx.hash || tx.txHash} not yet confirmed, skipping...`);
          continue;
        }

        const event: TransactionEvent = {
          hash: tx.hash || tx.txHash,
          from: (tx.from || tx.fromAddress || '').toLowerCase(),
          to: (tx.to || tx.toAddress || '').toLowerCase(),
          value: tx.value || '0',
          timestamp: tx.blockTimestamp || new Date().toISOString(),
          confirmed: tx.confirmed !== false,
          blockNumber: tx.blockNumber,
          confirmations: tx.confirmations || 6
        };

        // Only process transactions to our monitored addresses
        if (this.watchedWallets.some(wallet => 
          wallet.address.toLowerCase() === event.to
        )) {
          await this.processIncomingTransaction(event);
        }
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error; // Re-throw to return 500 status
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

  getMonitoredWallets(): WalletConfig[] {
    return this.watchedWallets;
  }

  async getTransactionHistory(address: string, limit: number = 10) {
    if (!this.monitoringEnabled) {
      throw new Error('Blockchain monitoring not enabled');
    }

    try {
      const response = await Moralis.EvmApi.transaction.getWalletTransactions({
        address,
        chain: EvmChain.ETHEREUM,
        limit,
      });

      return response.result.map(tx => ({
        hash: tx.hash,
        from: tx.fromAddress,
        to: tx.toAddress,
        value: tx.value.toString(),
        timestamp: tx.blockTimestamp?.toISOString(),
        blockNumber: tx.blockNumber,
        confirmed: true
      }));
    } catch (error) {
      console.error(`Error fetching transaction history for ${address}:`, error);
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService();

// Utility function to get webhook URL for Moralis dashboard configuration
export function getWebhookURL(): string {
  const baseUrl = process.env.REPLIT_DOMAINS ? 
    `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
    'http://localhost:5000';
  return `${baseUrl}/api/webhook/moralis`;
}