import { pgTable, text, serial, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  totalInvested: decimal("total_invested", { precision: 12, scale: 2 }).default("0"),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0"),
  dailyRoi: decimal("daily_roi", { precision: 5, scale: 2 }).default("0"),
  lastRoiUpdate: timestamp("last_roi_update").defaultNow(),
  // KYC fields
  isVerified: boolean("is_verified").default(false),
  idDocumentUrl: text("id_document_url"),
  ssnOrNationalId: text("ssn_or_national_id"),
  verificationStatus: text("verification_status").default("pending"), // pending, approved, rejected
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
  status: text("status").notNull().default("pending"), // 'pending', 'blockchain_confirmed', 'completed', 'failed'
  blockConfirmations: serial("block_confirmations"),
  requiredConfirmations: serial("required_confirmations"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const withdrawalTransactions = pgTable("withdrawal_transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  cryptocurrency: text("cryptocurrency").notNull(), // 'BTC', 'ETH', 'BNB', 'USDT'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // USD amount
  walletAddress: text("wallet_address").notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
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

export const kycVerificationSchema = z.object({
  ssnOrNationalId: z.string().min(1, "SSN or National ID is required"),
  idDocumentUrl: z.string().url("Valid ID document URL is required"),
});

export const withdrawalSchema = z.object({
  cryptocurrency: z.enum(["BTC", "ETH", "BNB", "USDT"], {
    errorMap: () => ({ message: "Please select a valid cryptocurrency" })
  }),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Must be a valid positive number"
  ),
  walletAddress: z.string().min(1, "Wallet address is required"),
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
export type WithdrawalTransaction = typeof withdrawalTransactions.$inferSelect;
export type CryptoFundingData = z.infer<typeof cryptoFundingSchema>;
export type KYCVerificationData = z.infer<typeof kycVerificationSchema>;
export type WithdrawalData = z.infer<typeof withdrawalSchema>;
