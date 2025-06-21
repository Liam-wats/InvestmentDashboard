import { users, fundingTransactions, type User, type InsertUser, type FundingTransaction, type InsertFundingTransaction } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  createFundingTransaction(transaction: InsertFundingTransaction): Promise<FundingTransaction>;
  getUserFundingTransactions(userId: number): Promise<FundingTransaction[]>;
  updateFundingTransactionStatus(id: number, status: string): Promise<void>;
}

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
    // Hash the password before storing
    const passwordHash = await bcrypt.hash(insertUser.password, 12);
    
    const [user] = await db
      .insert(users)
      .values([{
        email: insertUser.email,
        name: insertUser.name,
        passwordHash
      }])
      .returning();
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
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
