import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
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

  // Investment data routes (for future API integration)
  app.get("/api/investments", async (req, res) => {
    // Mock investment data - in production, fetch from database
    res.json([
      {
        id: 1,
        symbol: "AAPL",
        name: "Apple Inc.",
        shares: 10,
        currentPrice: 185.00,
        purchasePrice: 175.00,
        type: "stock"
      }
    ]);
  });

  app.get("/api/portfolio", async (req, res) => {
    // Mock portfolio data
    res.json({
      totalInvested: 25430,
      currentValue: 34127,
      roi: 34.2,
      allocation: {
        stocks: 45,
        etfs: 30,
        bonds: 15,
        cash: 10
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
