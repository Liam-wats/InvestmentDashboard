import { pgTable, text, serial, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  shares: decimal("shares", { precision: 10, scale: 4 }).notNull(),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'stock', 'etf', 'bond', 'cash'
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  type: text("type").notNull(), // 'buy', 'sell', 'dividend'
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  shares: decimal("shares", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fundingTransactions = pgTable("funding_transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  cryptocurrency: text("cryptocurrency").notNull(), // 'BTC', 'ETH', 'USDT', etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // USD amount
  walletAddress: text("wallet_address").notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertFundingTransactionSchema = createInsertSchema(fundingTransactions).omit({
  id: true,
  createdAt: true,
});

export const cryptoFundingSchema = z.object({
  cryptocurrency: z.string().min(1, "Please select a cryptocurrency"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Must be a valid positive number"
  ),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type FundingTransaction = typeof fundingTransactions.$inferSelect;
export type InsertFundingTransaction = z.infer<typeof insertFundingTransactionSchema>;
export type CryptoFundingData = z.infer<typeof cryptoFundingSchema>;
