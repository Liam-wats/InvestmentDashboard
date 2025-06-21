import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const SALT_ROUNDS = 12;

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  try {
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (user.length === 0) {
      return res.status(403).json({ message: "User not found" });
    }

    req.userId = decoded.userId;
    req.user = user[0];
    next();
  } catch (error) {
    console.error("Database error in auth middleware:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      try {
        const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
        if (user.length > 0) {
          req.userId = decoded.userId;
          req.user = user[0];
        }
      } catch (error) {
        console.error("Database error in optional auth middleware:", error);
      }
    }
  }

  next();
}