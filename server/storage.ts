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
    try {
      console.log("Creating user with data:", { email: insertUser.email, name: insertUser.name });
      
      // Hash the password before storing
      const passwordHash = await bcrypt.hash(insertUser.password, 12);
      console.log("Password hashed successfully");
      
      const [user] = await db
        .insert(users)
        .values({
          email: insertUser.email,
          name: insertUser.name,
          passwordHash
        })
        .returning();
        
      console.log("User created successfully:", { id: user.id, email: user.email });
      return user;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      console.log("Verifying password for email:", email);
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        console.log("User not found");
        return null;
      }

      console.log("User found, comparing password");
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log("Password validation result:", isValid);
      
      return isValid ? user : null;
    } catch (error) {
      console.error("Error in verifyPassword:", error);
      throw error;
    }
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
