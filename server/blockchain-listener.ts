import { storage } from './storage';
import { roiService } from './roi';

interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  symbol: string;
  confirmations: number;
  blockNumber: number;
}

class BlockchainListener {
  private readonly walletAddresses = {
    BTC: 'bc1q0uanf2f9px7q5r7maka05mwanutj8gvpqym62g',
    ETH: '0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0',
    BNB: '0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0',
    USDT: '0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0'
  };

  private readonly requiredConfirmations = {
    BTC: 1,
    ETH: 12,
    BNB: 15,
    USDT: 12
  };

  async initializeListeners() {
    console.log('Blockchain listeners initialized for wallets:', this.walletAddresses);
    
    // In a production environment, you would set up:
    // 1. WebSocket connections to blockchain nodes
    // 2. Webhook endpoints for services like Moralis, Alchemy, or Infura
    // 3. Periodic polling for new transactions
    
    // For this demo, we'll simulate the listener
    this.simulateTransactionDetection();
  }

  async processIncomingTransaction(transactionData: TransactionData): Promise<boolean> {
    try {
      console.log('Processing incoming transaction:', transactionData);

      // Verify transaction is to one of our wallet addresses
      const walletSymbol = this.getWalletSymbol(transactionData.to);
      if (!walletSymbol) {
        console.log('Transaction not for our wallets, ignoring');
        return false;
      }

      // Check if transaction has enough confirmations
      const requiredConf = this.requiredConfirmations[walletSymbol as keyof typeof this.requiredConfirmations];
      if (transactionData.confirmations < requiredConf) {
        console.log(`Transaction needs ${requiredConf} confirmations, currently has ${transactionData.confirmations}`);
        return false;
      }

      // Convert transaction value to USD
      const usdAmount = await this.convertToUSD(transactionData.value, transactionData.symbol);
      if (usdAmount <= 0) {
        console.log('Invalid transaction amount');
        return false;
      }

      // Find pending funding transaction that matches this payment
      const pendingTransaction = await storage.findPendingFundingTransaction({
        walletAddress: transactionData.to,
        cryptocurrency: transactionData.symbol,
        approximateAmount: usdAmount
      });

      if (!pendingTransaction) {
        console.log('No matching pending transaction found');
        return false;
      }

      // Update the funding transaction status
      await storage.updateFundingTransactionStatus(pendingTransaction.id, 'confirmed', transactionData.hash);

      // Update user's total invested amount
      await storage.updateUserInvestment(pendingTransaction.userId, usdAmount);

      // Recalculate ROI rate for the user
      await roiService.calculateUserROI(pendingTransaction.userId);

      console.log(`Successfully processed funding for user ${pendingTransaction.userId}: $${usdAmount}`);
      
      // TODO: Send notification to user
      await this.notifyUser(pendingTransaction.userId, usdAmount, transactionData.symbol);

      return true;
    } catch (error) {
      console.error('Error processing transaction:', error);
      return false;
    }
  }

  private getWalletSymbol(address: string): string | null {
    for (const [symbol, walletAddress] of Object.entries(this.walletAddresses)) {
      if (walletAddress.toLowerCase() === address.toLowerCase()) {
        return symbol;
      }
    }
    return null;
  }

  private async convertToUSD(value: string, symbol: string): Promise<number> {
    try {
      // Get current price from our crypto service
      const response = await fetch(`http://localhost:5000/api/crypto/price/${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to get ${symbol} price`);
      }
      
      const priceData = await response.json();
      const cryptoAmount = parseFloat(value);
      const usdAmount = cryptoAmount * priceData.price;
      
      return usdAmount;
    } catch (error) {
      console.error(`Error converting ${symbol} to USD:`, error);
      return 0;
    }
  }

  private async notifyUser(userId: number, amount: number, cryptocurrency: string) {
    // TODO: Implement email/in-app notification
    console.log(`Notification: User ${userId} funding confirmed - $${amount} from ${cryptocurrency}`);
  }

  // Demo simulation - remove in production
  private simulateTransactionDetection() {
    console.log('Blockchain listener simulation active - waiting for transactions...');
    
    // This would be replaced with actual blockchain monitoring
    // For demo purposes, you can manually trigger transaction processing
  }

  // Manual trigger for testing - remove in production
  async testTransaction(userId: number, amount: number, cryptocurrency: string) {
    const walletAddress = this.walletAddresses[cryptocurrency as keyof typeof this.walletAddresses];
    if (!walletAddress) {
      throw new Error('Unsupported cryptocurrency');
    }

    // Create a simulated transaction
    const mockTransaction: TransactionData = {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: '0x' + Math.random().toString(16).substr(2, 40),
      to: walletAddress,
      value: (amount / (cryptocurrency === 'BTC' ? 43250 : cryptocurrency === 'ETH' ? 2580 : 1)).toString(),
      symbol: cryptocurrency,
      confirmations: this.requiredConfirmations[cryptocurrency as keyof typeof this.requiredConfirmations],
      blockNumber: Math.floor(Math.random() * 1000000)
    };

    return await this.processIncomingTransaction(mockTransaction);
  }
}

export const blockchainListener = new BlockchainListener();