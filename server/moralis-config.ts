import { getWebhookURL } from './blockchain';

// Configuration for Moralis Streams
export const MORALIS_STREAM_CONFIG = {
  webhookUrl: getWebhookURL(),
  description: "InvestWise Wallet Monitor",
  tag: "investwise-funding",
  chains: ["0x1"], // Ethereum mainnet
  includeContractLogs: false,
  includeInternalTxs: false,
  includeAllTxLogs: false,
  includeNativeTxs: true,
  advancedOptions: [
    {
      topic0: "Transfer(address,address,uint256)",
      includeNativeTxs: true
    }
  ]
};

// Wallet addresses to monitor
export const MONITORED_WALLETS = {
  ethereum: [
    "0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0"
  ],
  bitcoin: [
    "bc1q0uanf2f9px7q5r7maka05mwanutj8gvpqym62g"
  ]
};

// Function to log configuration info for user setup
export function logMoralisConfiguration() {
  console.log('\n=== MORALIS CONFIGURATION ===');
  console.log('Webhook URL for Moralis Dashboard:', getWebhookURL());
  console.log('Monitored Ethereum Wallets:', MONITORED_WALLETS.ethereum);
  console.log('Monitored Bitcoin Wallets:', MONITORED_WALLETS.bitcoin);
  console.log('\nMoralis Streams Setup Instructions:');
  console.log('1. Go to https://admin.moralis.io/streams');
  console.log('2. Click "Create New Stream"');
  console.log('3. Use the webhook URL above');
  console.log('4. Select Ethereum Mainnet (Chain ID: 0x1)');
  console.log('5. Add wallet addresses from the list above');
  console.log('6. Enable "Native Transactions" and "Contract Interactions"');
  console.log('7. Set "Include Logs" to false for better performance');
  console.log('8. Add tag: "investwise-funding"');
  console.log('9. Set minimum confirmations to 3 for security');
  console.log('10. Enable "Include Contract Logs" for ERC-20 token tracking');
  console.log('================================\n');
}