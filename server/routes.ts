import express, { type Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createServer, type Server } from "http";
import { insertUserSchema, loginSchema, type User, type InsertUser, type LoginData } from "@shared/schema";
import { db } from "./db";
import { users, fundingTransactions, investments } from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, authenticateToken, type AuthRequest } from "./auth";
import { coinMarketCapService } from "./coinmarket";
import { startROICronJob, updateUserInvestment } from "./roi";

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
        passwordHash: hashedPassword,
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
      const isValidPassword = await verifyPassword(password, user[0].passwordHash);
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

      const transaction = await db.insert(fundingTransactions).values({
        userId: req.userId!,
        cryptocurrency,
        amount: numericAmount.toFixed(2),
        walletAddress,
        status: "confirmed", // Auto-confirm for demo
      }).returning();

      // Update user's investment
      await updateUserInvestment(req.userId!, numericAmount);

      res.json({ 
        message: "Funding transaction created successfully", 
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

  const httpServer = createServer(app);
  return httpServer;
}