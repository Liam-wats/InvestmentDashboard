import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, cryptoFundingSchema } from "@shared/schema";
import { generateToken, authenticateToken, type AuthRequest } from "./auth";
import express from "express";
import { getCachedCryptoPrices } from "./crypto-api";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Body parser middleware
  app.use(express.json());
  
  // Registration route
  app.post("/api/register", async (req, res) => {
    try {
      console.log("Registration request body:", req.body);
      
      // Validate request body
      if (!req.body || !req.body.email || !req.body.password || !req.body.name) {
        return res.status(400).json({ error: "Missing required fields: name, email, password" });
      }
      
      const userData = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", { email: userData.email, name: userData.name });
      
      const existingUser = await storage.getUserByEmail(userData.email);
      console.log("Existing user check:", !!existingUser);
      
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser(userData);
      console.log("Created user:", { id: user.id, email: user.email, name: user.name });
      
      const token = generateToken(user.id);
      console.log("Generated token for user ID:", user.id);
      
      res.json({ 
        user: { id: user.id, email: user.email, name: user.name },
        token
      });
    } catch (error: any) {
      console.error("Registration error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Registration failed", details: error.message });
    }
  });

  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      console.log("Login request body:", req.body);
      const { email, password } = loginSchema.parse(req.body);
      console.log("Parsed login data:", { email, password: "***" });
      
      const user = await storage.verifyPassword(email, password);
      console.log("User verification result:", user ? "success" : "failed");
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      console.log("Generated token for login:", user.id);
      
      res.json({ 
        user: { id: user.id, email: user.email, name: user.name },
        token
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Login failed", details: error.message });
    }
  });

  // Protected funding routes
  app.post("/api/funding", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { cryptocurrency, amount, walletAddress } = req.body;
      
      // Create funding transaction for authenticated user
      const transaction = await storage.createFundingTransaction({
        userId: req.userId!,
        cryptocurrency,
        amount: amount.toString(),
        walletAddress,
        status: "completed" // Auto-confirm for demo
      });
      
      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Funding error:", error);
      res.status(500).json({ error: "Failed to create funding transaction" });
    }
  });

  // Protected portfolio route - user can only access their own data
  app.get("/api/users/:userId/funding-transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const requestedUserId = parseInt(req.params.userId);
      
      // Ensure user can only access their own data
      if (req.userId !== requestedUserId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const transactions = await storage.getUserFundingTransactions(requestedUserId);
      res.json(transactions);
    } catch (error) {
      console.error("Portfolio error:", error);
      res.status(500).json({ error: "Failed to fetch funding transactions" });
    }
  });

  // Real-time cryptocurrency prices endpoint
  app.get("/api/crypto/prices", async (req, res) => {
    try {
      const symbols = req.query.symbols as string;
      if (!symbols) {
        return res.status(400).json({ error: "Symbols parameter required" });
      }
      
      const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());
      const prices = await getCachedCryptoPrices(symbolArray);
      
      res.json(prices);
    } catch (error) {
      console.error("Crypto prices error:", error);
      res.status(500).json({ error: "Failed to fetch cryptocurrency prices" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
