// Test webhook endpoint functionality
import axios from 'axios';

export async function testWebhookEndpoint() {
  const baseUrl = process.env.REPLIT_DOMAINS ? 
    `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
    'http://localhost:5000';
  const webhookUrl = `${baseUrl}/api/webhook/moralis`;
  
  // Sample Moralis webhook payload
  const testPayload = {
    confirmed: true,
    chainId: "0x1",
    abi: [],
    streamId: "test-stream",
    tag: "investwise-funding",
    retries: 0,
    block: {
      number: "18500000",
      hash: "0x1234567890abcdef",
      timestamp: "1698765432"
    },
    logs: [],
    txs: [
      {
        hash: "0xabcdef1234567890",
        from: "0x742d35cc6559988722e8c5e1b9b8c5c0c9b7c1a8",
        to: "0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0",
        value: "1000000000000000000", // 1 ETH in wei
        blockNumber: "18500000",
        blockTimestamp: new Date().toISOString(),
        confirmations: 6
      }
    ],
    txHash: "0xabcdef1234567890",
    fromAddress: "0x742d35cc6559988722e8c5e1b9b8c5c0c9b7c1a8",
    toAddress: "0xCd3B1Afe359d96eD77E3f44B7A55Dc12040858D0",
    value: "1000000000000000000",
    blockNumber: "18500000",
    blockTimestamp: new Date().toISOString(),
    confirmations: 6
  };

  try {
    console.log('Testing webhook endpoint...');
    console.log('Webhook URL:', webhookUrl);
    console.log('Test payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(webhookUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'test-signature'
      }
    });
    
    console.log('Webhook test response:', response.status, response.data);
    return true;
  } catch (error) {
    console.error('Webhook test failed:', error);
    return false;
  }
}

// Test Bitcoin transaction format (for future implementation)
export const sampleBitcoinWebhook = {
  hash: "abc123def456",
  from: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  to: "bc1q0uanf2f9px7q5r7maka05mwanutj8gvpqym62g",
  value: "100000000", // 1 BTC in satoshis
  timestamp: new Date().toISOString(),
  confirmed: true,
  blockNumber: 750000,
  confirmations: 6
};