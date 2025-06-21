import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import cron from "node-cron";

export interface ROITier {
  minAmount: number;
  maxAmount: number;
  dailyRate: number;
}

export const ROI_TIERS: ROITier[] = [
  { minAmount: 100, maxAmount: 500, dailyRate: 1.5 },
  { minAmount: 600, maxAmount: 1000, dailyRate: 2.5 },
  { minAmount: 1001, maxAmount: 2000, dailyRate: 3.5 },
  { minAmount: 2001, maxAmount: 3000, dailyRate: 4.5 },
  { minAmount: 3001, maxAmount: 4000, dailyRate: 5.5 },
  { minAmount: 4001, maxAmount: 5000, dailyRate: 6.5 },
  { minAmount: 5001, maxAmount: 10000, dailyRate: 7.5 },
  { minAmount: 10001, maxAmount: 20000, dailyRate: 8.5 },
  { minAmount: 20001, maxAmount: 30000, dailyRate: 9.5 },
  { minAmount: 30001, maxAmount: 40000, dailyRate: 10.5 },
  { minAmount: 40001, maxAmount: 50000, dailyRate: 11.5 },
  { minAmount: 50001, maxAmount: 100000, dailyRate: 12.5 },
  { minAmount: 100001, maxAmount: 250000, dailyRate: 13.5 },
  { minAmount: 250001, maxAmount: 500000, dailyRate: 14.5 },
  { minAmount: 500001, maxAmount: Infinity, dailyRate: 15.0 },
];

export function calculateDailyROI(totalInvested: number): number {
  if (totalInvested < 100) return 0;
  if (totalInvested > 500000) return 15.0;

  for (const tier of ROI_TIERS) {
    if (totalInvested >= tier.minAmount && totalInvested <= tier.maxAmount) {
      return tier.dailyRate;
    }
  }

  return 0;
}

export function calculateROIGrowth(currentBalance: number, dailyROI: number): number {
  if (currentBalance > 500000) return 0;
  const growth = currentBalance * (dailyROI / 100);
  const newBalance = currentBalance + growth;
  
  // Cap at $500,000
  return Math.min(newBalance, 500000) - currentBalance;
}

export async function processUserROI(userId: number): Promise<void> {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userResult.length === 0) {
      console.error(`User ${userId} not found`);
      return;
    }

    const user = userResult[0];
    const totalInvested = parseFloat(user.totalInvested || "0");
    const currentBalance = parseFloat(user.currentBalance || "0");
    
    // Calculate current daily ROI rate
    const dailyROI = calculateDailyROI(totalInvested);
    
    // Calculate ROI growth
    const roiGrowth = calculateROIGrowth(currentBalance, dailyROI);
    const newBalance = currentBalance + roiGrowth;

    // Update user record
    await db.update(users)
      .set({
        currentBalance: newBalance.toFixed(2),
        dailyRoi: dailyROI.toFixed(2),
        lastRoiUpdate: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`ROI processed for user ${userId}: +$${roiGrowth.toFixed(2)} (${dailyROI}% of $${currentBalance.toFixed(2)})`);
  } catch (error) {
    console.error(`Error processing ROI for user ${userId}:`, error);
  }
}

export async function processAllUsersROI(): Promise<void> {
  try {
    const allUsers = await db.select({ id: users.id }).from(users);
    
    console.log(`Processing daily ROI for ${allUsers.length} users...`);
    
    for (const user of allUsers) {
      await processUserROI(user.id);
    }
    
    console.log("Daily ROI processing completed");
  } catch (error) {
    console.error("Error processing daily ROI for all users:", error);
  }
}

export function startROICronJob(): void {
  // Run daily ROI calculation at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log("Starting daily ROI calculation...");
    await processAllUsersROI();
  }, {
    timezone: "UTC"
  });

  // Also run every 5 minutes for testing (remove in production)
  if (process.env.NODE_ENV === "development") {
    cron.schedule('*/5 * * * *', async () => {
      console.log("Running ROI calculation (development mode)...");
      await processAllUsersROI();
    });
  }

  console.log("ROI cron job started - will run daily at midnight UTC");
}

export async function updateUserInvestment(userId: number, investmentAmount: number): Promise<void> {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userResult.length === 0) {
      throw new Error("User not found");
    }

    const user = userResult[0];
    const currentTotalInvested = parseFloat(user.totalInvested || "0");
    const currentBalance = parseFloat(user.currentBalance || "0");
    
    const newTotalInvested = currentTotalInvested + investmentAmount;
    const newBalance = currentBalance + investmentAmount;
    const newDailyROI = calculateDailyROI(newTotalInvested);

    await db.update(users)
      .set({
        totalInvested: newTotalInvested.toFixed(2),
        currentBalance: newBalance.toFixed(2),
        dailyRoi: newDailyROI.toFixed(2),
      })
      .where(eq(users.id, userId));

    console.log(`Updated investment for user ${userId}: +$${investmentAmount}, total: $${newTotalInvested}, ROI: ${newDailyROI}%`);
  } catch (error) {
    console.error(`Error updating investment for user ${userId}:`, error);
    throw error;
  }
}