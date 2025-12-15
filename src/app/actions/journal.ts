"use server";

import { db } from "@/db";
import { transactionEntries, transactions, accounts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, sql } from "drizzle-orm";

export async function getJournalEntries(page: number = 1, pageSize: number = 10) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const offset = (page - 1) * pageSize;

  // We need to join with transactions to filter by userId and sort by date
  // Since Drizzle 'findMany' is easier for relations but here we have explicit joins for performance/structure?
  // The existing code uses query builder 'db.select(...)'. This is fine.
  
  const entries = await db
    .select({
      id: transactionEntries.id,
      date: transactions.date,
      description: transactions.description,
      accountName: accounts.name,
      type: transactionEntries.type,
      amount: transactionEntries.amount,
    })
    .from(transactionEntries)
    .innerJoin(transactions, eq(transactionEntries.transactionId, transactions.id))
    .innerJoin(accounts, eq(transactionEntries.accountId, accounts.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(pageSize)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactionEntries)
    .innerJoin(transactions, eq(transactionEntries.transactionId, transactions.id))
    .where(eq(transactions.userId, userId));

  const totalCount = Number(countResult.count);
  const totalPages = Math.ceil(totalCount / pageSize);

  const data = entries.map(entry => ({
    ...entry,
    type: entry.type as 'debit' | 'credit',
  }));

  return {
    data,
    meta: {
      page,
      pageSize,
      totalCount,
      totalPages,
    }
  };
}
