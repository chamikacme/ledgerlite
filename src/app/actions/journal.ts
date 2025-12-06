"use server";

import { db } from "@/db";
import { transactionEntries, transactions, accounts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";

export async function getJournalEntries() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // We need to join with transactions to filter by userId and sort by date
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
    .orderBy(desc(transactions.date), desc(transactions.id));

  return entries.map(entry => ({
    ...entry,
    type: entry.type as 'debit' | 'credit',
  }));
}
