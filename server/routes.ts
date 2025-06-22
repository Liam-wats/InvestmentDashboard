import express, { type Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createServer, type Server } from "http";
import { insertUserSchema, loginSchema, kycVerificationSchema, withdrawalSchema, type User, type InsertUser, type LoginData, type KYCVerificationData, type WithdrawalData } from "@shared/schema";
import { db } from "./db";
import { users, fundingTransactions, investments, withdrawalTransactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, authenticateToken, type AuthRequest } from "./auth";
import { coinMarketCapService } from "./coinmarket";
import { startROICronJob, updateUserInvestment } from "./roi";
import { blockchainService } from "./blockchain";

// Validation middleware
function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ message: "Invalid request data", error: error });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Start ROI cron job
  startROICronJob();
  
  // Initialize blockchain monitoring
  await blockchainService.initialize();

  // PostgreSQL session store
  const PostgreSqlStore = pgSession(session);
  app.use(
    session({
      store: new PostgreSqlStore({
        pool: pool,
        tableName: "session",
      }),
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  // Moralis webhook endpoint for real-time transaction monitoring
  app.post("/api/webhook/moralis", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['x-signature'];
      const body = req.body;
      
      // In production, verify webhook signature here
      // For now, we'll process the webhook data directly
      
      let webhookData;
      if (Buffer.isBuffer(body)) {
        webhookData = JSON.parse(body.toString());
      } else {
        webhookData = body;
      }

      console.log('Received Moralis webhook:', JSON.stringify(webhookData, null, 2));
      
      // Process the webhook data
      await blockchainService.processWebhookEvent(webhookData);
      
      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing Moralis webhook:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Test endpoint to validate webhook functionality
  app.post("/api/test-webhook", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { testWebhookEndpoint } = await import('./webhook-test');
      const result = await testWebhookEndpoint();
      
      res.json({ 
        message: 'Webhook test completed', 
        success: result,
        webhookUrl: `${req.protocol}://${req.get('host')}/api/webhook/moralis`
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get blockchain monitoring status
  app.get("/api/blockchain/status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const status = {
        enabled: blockchainService.isMonitoringEnabled(),
        webhookUrl: `${req.protocol}://${req.get('host')}/api/webhook/moralis`,
        monitoredWallets: blockchainService.getMonitoredWallets()
      };
      
      res.json(status);
    } catch (error) {
      console.error('Error getting blockchain status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get transaction history for a wallet
  app.get("/api/blockchain/transactions/:address", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!blockchainService.isMonitoringEnabled()) {
        return res.status(503).json({ message: 'Blockchain monitoring not available' });
      }
      
      const transactions = await blockchainService.getTransactionHistory(address, limit);
      res.json({ transactions });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User registration
  app.post("/api/register", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const { email, password, name } = req.body as InsertUser;
      
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(password);

      // Create new user
      const newUser = await db.insert(users).values({
        email,
        password: hashedPassword,
        name,
        totalInvested: "0",
        currentBalance: "0",
        dailyRoi: "0",
      }).returning();

      // Generate JWT token
      const token = generateToken(newUser[0].id);

      res.json({ 
        message: "User registered successfully", 
        user: { 
          id: newUser[0].id, 
          email: newUser[0].email, 
          name: newUser[0].name,
          totalInvested: newUser[0].totalInvested,
          currentBalance: newUser[0].currentBalance,
          dailyRoi: newUser[0].dailyRoi
        },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User login
  app.post("/api/login", validateRequest(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body as LoginData;
      
      // Find user by email
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (user.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user[0].password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = generateToken(user[0].id);

      res.json({ 
        message: "Login successful", 
        user: { 
          id: user[0].id, 
          email: user[0].email, 
          name: user[0].name,
          totalInvested: user[0].totalInvested,
          currentBalance: user[0].currentBalance,
          dailyRoi: user[0].dailyRoi
        },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user funding transactions (protected route)
  app.get("/api/users/:userId/funding-transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Ensure user can only access their own data
      if (req.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const transactions = await db.select()
        .from(fundingTransactions)
        .where(eq(fundingTransactions.userId, userId));

      res.json(transactions);
    } catch (error) {
      console.error("Error fetching funding transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create funding transaction (protected route)
  app.post("/api/funding-transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { cryptocurrency, amount, walletAddress } = req.body;
      
      if (!cryptocurrency || !amount || !walletAddress) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Check if user exists and is verified
      const user = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user[0].isVerified) {
        return res.status(403).json({ message: "Identity verification required before funding" });
      }

      const transaction = await db.insert(fundingTransactions).values({
        userId: req.userId!,
        cryptocurrency,
        amount: numericAmount.toFixed(2),
        walletAddress,
        status: "pending", // Properly set to pending for blockchain validation
      }).returning();

      res.json({ 
        message: "Funding transaction created successfully. Awaiting blockchain confirmation.", 
        transaction: transaction[0] 
      });
    } catch (error) {
      console.error("Error creating funding transaction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user profile (protected route)
  app.get("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
      
      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        totalInvested: user[0].totalInvested,
        currentBalance: user[0].currentBalance,
        dailyRoi: user[0].dailyRoi,
        lastRoiUpdate: user[0].lastRoiUpdate,
        isVerified: user[0].isVerified,
        verificationStatus: user[0].verificationStatus,
        createdAt: user[0].createdAt,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get cryptocurrency prices
  app.get("/api/crypto/prices", async (req, res) => {
    try {
      const symbols = req.query.symbols as string;
      if (!symbols) {
        // Get top 10 coins by default
        const topCoins = await coinMarketCapService.getTopCoins(10);
        return res.json(topCoins);
      }

      const symbolArray = symbols.split(',').map(s => s.trim());
      const coinData = await coinMarketCapService.getCoinsBySymbols(symbolArray);
      res.json(coinData);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      res.status(500).json({ message: "Failed to fetch cryptocurrency prices" });
    }
  });

  // Get portfolio data (protected route)
  app.get("/api/portfolio", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
      
      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const userInvestments = await db.select()
        .from(investments)
        .where(eq(investments.userId, req.userId!));

      const fundingTxs = await db.select()
        .from(fundingTransactions)
        .where(eq(fundingTransactions.userId, req.userId!));

      res.json({
        user: {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          totalInvested: user[0].totalInvested,
          currentBalance: user[0].currentBalance,
          dailyRoi: user[0].dailyRoi,
          lastRoiUpdate: user[0].lastRoiUpdate,
        },
        investments: userInvestments,
        fundingTransactions: fundingTxs,
      });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // KYC Verification (protected route)
  app.post("/api/kyc/verify", authenticateToken, validateRequest(kycVerificationSchema), async (req: AuthRequest, res) => {
    try {
      const { ssnOrNationalId, idDocumentUrl } = req.body as KYCVerificationData;
      
      await db.update(users)
        .set({
          ssnOrNationalId,
          idDocumentUrl,
          verificationStatus: "approved", // Auto-approve for demo
          isVerified: true
        })
        .where(eq(users.id, req.userId!));

      res.json({ message: "Identity verification completed successfully" });
    } catch (error) {
      console.error("Error verifying identity:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create withdrawal request (protected route)
  app.post("/api/withdrawals", authenticateToken, validateRequest(withdrawalSchema), async (req: AuthRequest, res) => {
    try {
      const { cryptocurrency, amount, walletAddress } = req.body as WithdrawalData;
      
      const user = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is verified
      if (!user[0].isVerified) {
        return res.status(403).json({ message: "Identity verification required before withdrawal" });
      }

      const numericAmount = parseFloat(amount);
      const currentBalance = parseFloat(user[0].currentBalance || "0");

      // Validate sufficient balance
      if (numericAmount > currentBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Minimum withdrawal amount
      if (numericAmount < 50) {
        return res.status(400).json({ message: "Minimum withdrawal amount is $50" });
      }

      // Create withdrawal transaction
      const withdrawal = await db.insert(withdrawalTransactions).values({
        userId: req.userId!,
        cryptocurrency,
        amount: numericAmount.toFixed(2),
        walletAddress,
        status: "pending"
      }).returning();

      // Update user balance
      const newBalance = currentBalance - numericAmount;
      await db.update(users)
        .set({ currentBalance: newBalance.toFixed(2) })
        .where(eq(users.id, req.userId!));

      res.json({ 
        message: "Withdrawal request submitted successfully", 
        withdrawal: withdrawal[0] 
      });
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user withdrawals (protected route)
  app.get("/api/withdrawals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const withdrawals = await db.select()
        .from(withdrawalTransactions)
        .where(eq(withdrawalTransactions.userId, req.userId!));

      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}