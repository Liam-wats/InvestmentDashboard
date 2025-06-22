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
    
    // Check if exactly 24 hours have passed since last ROI update
    const lastRoiUpdate = user.lastRoiUpdate || user.createdAt;
    const now = new Date();
    const timeDiff = now.getTime() - new Date(lastRoiUpdate).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Only process ROI if exactly 24 hours or more have passed
    if (hoursDiff < 24) {
      console.log(`ROI skipped for user ${userId}: Only ${hoursDiff.toFixed(1)} hours since last update`);
      return;
    }
    
    // Calculate current daily ROI rate
    const dailyROI = calculateDailyROI(totalInvested);
    
    if (dailyROI > 0 && totalInvested > 0) {
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

      console.log(`ROI processed for user ${userId}: +$${roiGrowth.toFixed(2)} (${dailyROI}% of $${currentBalance.toFixed(2)}) after ${hoursDiff.toFixed(1)} hours`);
    } else {
      console.log(`ROI processed for user ${userId}: +$0.00 (${dailyROI}% of $${currentBalance.toFixed(2)})`);
    }
  } catch (error) {
    console.error(`Error processing ROI for user ${userId}:`, error);
  }
}

export async function processAllUsersROI(): Promise<void> {
  try {
    const allUsers = await db.select().from(users);
    
    console.log(`Checking 24-hour ROI eligibility for ${allUsers.length} users...`);
    let processedCount = 0;
    
    for (const user of allUsers) {
      const lastRoiUpdate = user.lastRoiUpdate || user.createdAt;
      const now = new Date();
      const hoursDiff = (now.getTime() - new Date(lastRoiUpdate).getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff >= 24) {
        await processUserROI(user.id);
        processedCount++;
      }
    }
    
    console.log(`24-hour ROI processing completed. ${processedCount} users processed.`);
  } catch (error) {
    console.error("Error processing 24-hour ROI for all users:", error);
  }
}

export function startROICronJob(): void {
  // Run ROI calculation every hour to check for users who need 24-hour ROI updates
  cron.schedule('0 * * * *', async () => {
    console.log("Checking for users eligible for 24-hour ROI updates...");
    await processAllUsersROI();
  }, {
    timezone: "UTC"
  });

  // Also run every 2 minutes for development testing
  if (process.env.NODE_ENV === "development") {
    cron.schedule('*/2 * * * *', async () => {
      console.log("Running ROI calculation check (development mode)...");
      await processAllUsersROI();
    });
  }

  console.log("ROI cron job started - will check hourly for 24-hour ROI eligibility");
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