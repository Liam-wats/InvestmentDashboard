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
  { minAmount: 100, maxAmount: 500, dailyRate: 5.0 },
  { minAmount: 600, maxAmount: 9000, dailyRate: 10.0 },
  { minAmount: 10000, maxAmount: Infinity, dailyRate: 25.0 },
];

export function calculateDailyROI(totalInvested: number): number {
  if (totalInvested < 100) return 0;

  for (const tier of ROI_TIERS) {
    if (totalInvested >= tier.minAmount && totalInvested <= tier.maxAmount) {
      return tier.dailyRate;
    }
  }

  return 0;
}

export function calculateROIGrowth(currentBalance: number, dailyROI: number): number {
  const growth = currentBalance * (dailyROI / 100);
  return growth;
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
    
    // Check if ROI was already processed today
    const lastRoiUpdate = user.lastRoiUpdate ? new Date(user.lastRoiUpdate) : null;
    const now = new Date();
    
    if (lastRoiUpdate) {
      const timeDiff = now.getTime() - lastRoiUpdate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Only process ROI if it's been more than 24 hours since last update
      if (hoursDiff < 24) {
        console.log(`ROI already processed for user ${userId} within last 24 hours`);
        return;
      }
    }
    
    // Only process ROI if user has invested funds
    if (totalInvested <= 0) {
      console.log(`User ${userId} has no investments, skipping ROI`);
      return;
    }
    
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
        lastRoiUpdate: now,
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

  // Also run every hour for testing in development (but still respect 24-hour limit)
  if (process.env.NODE_ENV === "development") {
    cron.schedule('0 * * * *', async () => {
      console.log("Running ROI calculation check (development mode)...");
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