"use server";

import { db } from "@/db";
import { transactions, transactionEntries, accounts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { desc, eq, and, gte } from "drizzle-orm";

export async function getRecentTransactions(limit: number = 5) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    with: {
      category: true,
      entries: {
        with: {
          account: true,
        },
      },
    },
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
    limit: limit,
  });
}

export async function getMonthlySpending() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch transactions for this month only
  const monthTransactions = await db.query.transactions.findMany({
    where: and(
        eq(transactions.userId, userId),
        gte(transactions.date, startOfMonth)
    ),
    with: {
      entries: {
        with: {
          account: true,
        },
      },
    },
  });

  // Calculate spending (Asset -> Expense/Liability)
  const monthlyWithdrawals = monthTransactions
    .filter(t => 
        t.entries.some(e => e.type === 'credit' && e.account.type === 'asset') && // Money leaving asset
        t.entries.some(e => e.type === 'debit' && (e.account.type === 'expense' || e.account.type === 'liability')) // Going to expense/liability
    )
    .reduce((acc, t) => acc + t.amount, 0);

  return monthlyWithdrawals;
}
