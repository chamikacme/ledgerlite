"use server";

import { db } from "@/db";
import { transactions, accounts, transactionEntries, categories } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export async function getIncomeVsExpenseData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const results = await db
        .select({
            name: sql<string>`to_char(${transactions.date}, 'Mon YYYY')`,
            monthDate: sql<string>`date_trunc('month', ${transactions.date})`,
            income: sql<number>`sum(case when ${accounts.type} = 'revenue' then (case when ${transactionEntries.type} = 'credit' then ${transactionEntries.amount} else -${transactionEntries.amount} end) else 0 end)`,
            expense: sql<number>`sum(case when ${accounts.type} = 'expense' then (case when ${transactionEntries.type} = 'debit' then ${transactionEntries.amount} else -${transactionEntries.amount} end) else 0 end)`
        })
        .from(transactions)
        .innerJoin(transactionEntries, eq(transactions.id, transactionEntries.transactionId))
        .innerJoin(accounts, eq(transactionEntries.accountId, accounts.id))
        .where(and(
            eq(transactions.userId, userId),
            gte(transactions.date, sixMonthsAgo)
        ))
        .groupBy(sql`to_char(${transactions.date}, 'Mon YYYY')`, sql`date_trunc('month', ${transactions.date})`)
        .orderBy(sql`date_trunc('month', ${transactions.date})`);

    return results.map(r => ({
        name: r.name,
        income: Number(r.income || 0),
        expense: Number(r.expense || 0)
    }));
}

export async function getSpendingByCategoryData() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const results = await db
        .select({
            name: sql<string>`coalesce(${categories.name}, 'Uncategorized')`,
            value: sql<number>`sum(case when ${transactionEntries.type} = 'debit' then ${transactionEntries.amount} else -${transactionEntries.amount} end)`
        })
        .from(transactions)
        .innerJoin(transactionEntries, eq(transactions.id, transactionEntries.transactionId))
        .innerJoin(accounts, eq(transactionEntries.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(
            eq(transactions.userId, userId),
            gte(transactions.date, startOfMonth),
            eq(accounts.type, 'expense')
        ))
        .groupBy(sql`coalesce(${categories.name}, 'Uncategorized')`);

    return results.map(r => ({
        name: r.name,
        value: Number(r.value || 0)
    }));
}

export async function getIncomeByCategoryData() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const results = await db
        .select({
            name: sql<string>`coalesce(${categories.name}, 'Uncategorized')`,
            value: sql<number>`sum(case when ${transactionEntries.type} = 'credit' then ${transactionEntries.amount} else -${transactionEntries.amount} end)`
        })
        .from(transactions)
        .innerJoin(transactionEntries, eq(transactions.id, transactionEntries.transactionId))
        .innerJoin(accounts, eq(transactionEntries.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(
            eq(transactions.userId, userId),
            gte(transactions.date, startOfMonth),
            eq(accounts.type, 'revenue')
        ))
        .groupBy(sql`coalesce(${categories.name}, 'Uncategorized')`);

    return results.map(r => ({
        name: r.name,
        value: Number(r.value || 0)
    }));
}

export async function getAssetAllocationData() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const assetAccounts = await db.query.accounts.findMany({
        where: and(
            eq(accounts.userId, userId),
            eq(accounts.type, "asset")
        )
    });

    return assetAccounts.map(a => ({
        name: a.name,
        value: a.balance
    })).filter(a => a.value > 0);
}

export async function getNetWorthHistoryData() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // 1. Get current net worth
    const allAccounts = await db.query.accounts.findMany({
        where: eq(accounts.userId, userId)
    });

    let currentNetWorth = 0;
    allAccounts.forEach(a => {
        if (a.type === 'asset') currentNetWorth += a.balance;
        if (a.type === 'liability') currentNetWorth -= a.balance;
    });

    // 2. Get monthly net change for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyChanges = await db
        .select({
            month: sql<string>`to_char(${transactions.date}, 'Mon YYYY')`,
            monthDate: sql<string>`date_trunc('month', ${transactions.date})`,
            netChange: sql<number>`sum(
                case 
                    when ${accounts.type} = 'asset' or ${accounts.type} = 'liability' then 
                        (case when ${transactionEntries.type} = 'debit' then ${transactionEntries.amount} else -${transactionEntries.amount} end)
                    else 0
                end
            )`
        })
        .from(transactions)
        .innerJoin(transactionEntries, eq(transactions.id, transactionEntries.transactionId))
        .innerJoin(accounts, eq(transactionEntries.accountId, accounts.id))
        .where(and(
            eq(transactions.userId, userId),
            gte(transactions.date, sixMonthsAgo)
        ))
        .groupBy(sql`to_char(${transactions.date}, 'Mon YYYY')`, sql`date_trunc('month', ${transactions.date})`)
        .orderBy(desc(sql`date_trunc('month', ${transactions.date})`));

    // Convert to a map for easy lookup
    const changesMap: Record<string, number> = {};
    monthlyChanges.forEach(c => {
        changesMap[c.month] = Number(c.netChange);
    });

    const monthlyNetWorth: { name: string; value: number }[] = [];
    let runningNetWorth = currentNetWorth;

    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleString('default', { month: 'short', year: 'numeric' }));
    }

    // Process months backwards from today
    for (const monthKey of months) {
        monthlyNetWorth.push({ name: monthKey, value: runningNetWorth });
        runningNetWorth -= (changesMap[monthKey] || 0);
    }

    return monthlyNetWorth.reverse();
}
