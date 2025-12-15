"use server";

import { db } from "@/db";
import { transactionEntries, transactions, accounts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, asc, sql, and, ilike, gte, lte } from "drizzle-orm";

export async function getJournalEntries(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  from?: Date,
  to?: Date,
  sortBy: string = "date",
  sortOrder: "asc" | "desc" = "desc"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const offset = (page - 1) * pageSize;

  const conditions = [eq(transactions.userId, userId)];

  if (search) {
      // Search in transaction description or account name
      conditions.push(
          sql`(${ilike(transactions.description, `%${search}%`)} OR ${ilike(accounts.name, `%${search}%`)})`
      );
  }

  if (from) {
      conditions.push(gte(transactions.date, from));
  }
  
  if (to) {
    conditions.push(lte(transactions.date, to));
  }

  let orderBy;
  switch(sortBy) {
      case "date":
          orderBy = sortOrder === "asc" ? asc(transactions.date) : desc(transactions.date);
          break;
      case "amount":
          orderBy = sortOrder === "asc" ? asc(transactionEntries.amount) : desc(transactionEntries.amount);
          break;
      case "description":
          orderBy = sortOrder === "asc" ? asc(transactions.description) : desc(transactions.description);
          break;
      case "accountName":
          orderBy = sortOrder === "asc" ? asc(accounts.name) : desc(accounts.name);
          break;
      default:
           orderBy = sortOrder === "asc" ? asc(transactions.date) : desc(transactions.date);
  }

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
    .where(and(...conditions))
    .orderBy(orderBy, desc(transactions.id))
    .limit(pageSize)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactionEntries)
    .innerJoin(transactions, eq(transactionEntries.transactionId, transactions.id))
    .innerJoin(accounts, eq(transactionEntries.accountId, accounts.id))
    .where(and(...conditions));

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
