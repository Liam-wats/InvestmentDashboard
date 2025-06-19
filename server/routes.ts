import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, cryptoFundingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // For demo purposes, accept any valid email/password combination
      // In production, you would verify credentials against database
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user for demo
        const newUser = await storage.createUser({
          email: email,
          password: password, // In production, hash the password
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        });
        
        res.json({
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          }
        });
      } else {
        res.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Funding routes
  app.post("/api/funding", async (req, res) => {
    try {
      const { userId, cryptocurrency, amount, walletAddress } = req.body;
      
      // Create funding transaction
      const transaction = await storage.createFundingTransaction({
        userId: parseInt(userId),
        cryptocurrency,
        amount: amount.toString(),
        walletAddress,
        status: "pending"
      });
      
      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Funding error:", error);
      res.status(500).json({ error: "Failed to create funding transaction" });
    }
  });

  app.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await storage.getUserFundingTransactions(userId);
      
      // Calculate total invested amount
      const totalInvested = transactions
        .filter(t => t.status === "confirmed")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Calculate current value with 3% daily growth
      let currentValue = 0;
      const now = new Date();
      
      transactions
        .filter(t => t.status === "confirmed")
        .forEach(transaction => {
          const investmentDate = new Date(transaction.createdAt || now);
          const daysDiff = Math.floor((now.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
          const growthFactor = Math.pow(1.03, daysDiff);
          currentValue += parseFloat(transaction.amount) * growthFactor;
        });
      
      const roi = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
      
      res.json({
        totalInvested,
        currentValue,
        roi,
        profit: currentValue - totalInvested,
        transactions
      });
    } catch (error) {
      console.error("Portfolio error:", error);
      res.status(500).json({ error: "Failed to fetch portfolio data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
