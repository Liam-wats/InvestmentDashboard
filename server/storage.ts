import { users, fundingTransactions, type User, type InsertUser, type FundingTransaction, type InsertFundingTransaction } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createFundingTransaction(transaction: InsertFundingTransaction): Promise<FundingTransaction>;
  getUserFundingTransactions(userId: number): Promise<FundingTransaction[]>;
  updateFundingTransactionStatus(id: number, status: string): Promise<void>;
}

import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createFundingTransaction(transaction: InsertFundingTransaction): Promise<FundingTransaction> {
    const [fundingTransaction] = await db
      .insert(fundingTransactions)
      .values(transaction)
      .returning();
    return fundingTransaction;
  }

  async getUserFundingTransactions(userId: number): Promise<FundingTransaction[]> {
    return await db
      .select()
      .from(fundingTransactions)
      .where(eq(fundingTransactions.userId, userId));
  }

  async updateFundingTransactionStatus(id: number, status: string): Promise<void> {
    await db
      .update(fundingTransactions)
      .set({ status })
      .where(eq(fundingTransactions.id, id));
  }
}

export const storage = new DatabaseStorage();
