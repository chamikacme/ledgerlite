"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, gte } from "drizzle-orm";

export async function getIncomeVsExpenseData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const now = new Date();
  // Last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    // Aggregation in JS for simplicity with complex join logic
    // Fetch transactions and aggregate in JS.
    
    const allTransactions = await db.query.transactions.findMany({
        where: and(
            eq(transactions.userId, userId),
            gte(transactions.date, sixMonthsAgo)
        ),
        with: {
            entries: {
                with: {
                    account: true
                }
            }
        }
    });

    const monthlyData: Record<string, { name: string; income: number; expense: number }> = {};

    allTransactions.forEach(t => {
        const monthKey = t.date.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g. "Dec 2023"
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { name: monthKey, income: 0, expense: 0 };
        }

        // Determine if income or expense
        // Income: Credit to Revenue
        // Expense: Debit to Expense or Liability
        
        const isIncome = t.entries.some(e => e.type === 'credit' && e.account.type === 'revenue');
        const isExpense = t.entries.some(e => e.type === 'debit' && (e.account.type === 'expense' || e.account.type === 'liability'));

        if (isIncome) {
            monthlyData[monthKey].income += t.amount;
        }
        if (isExpense) {
            monthlyData[monthKey].expense += t.amount;
        }
    });

    // Sort by date
    return Object.values(monthlyData).sort((a, b) => {
        const dateA = new Date(a.name);
        const dateB = new Date(b.name);
        return dateA.getTime() - dateB.getTime();
    });
}

export async function getSpendingByCategoryData() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const txs = await db.query.transactions.findMany({
        where: and(
            eq(transactions.userId, userId),
            gte(transactions.date, startOfMonth)
        ),
        with: {
            category: true,
            entries: {
                with: {
                    account: true
                }
            }
        }
    });

    const categoryData: Record<string, number> = {};

    txs.forEach(t => {
        const isExpense = t.entries.some(e => e.type === 'debit' && (e.account.type === 'expense' || e.account.type === 'liability'));
        
        if (isExpense && t.category) {
            if (!categoryData[t.category.name]) {
                categoryData[t.category.name] = 0;
            }
            categoryData[t.category.name] += t.amount;
        } else if (isExpense && !t.category) {
             if (!categoryData["Uncategorized"]) {
                categoryData["Uncategorized"] = 0;
            }
            categoryData["Uncategorized"] += t.amount;
        }
    });

    return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
}
