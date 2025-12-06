"use server";

import { db } from "@/db";
import { recurringTransactions, transactions, transactionEntries, accounts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

const recurringTransactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.coerce.number().optional(),
  type: z.enum(["withdrawal", "deposit", "transfer"]),
  fromAccountId: z.coerce.number().optional(),
  toAccountId: z.coerce.number().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  startDate: z.coerce.date(),
  totalOccurrences: z.preprocess(
    (val) => {
      // Convert empty string or undefined to null
      if (val === "" || val === undefined || val === null) return null;
      return val;
    },
    z.number().int().positive().nullable().optional()
  ),
});

export async function createRecurringTransaction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    frequency: formData.get("frequency"),
    startDate: formData.get("startDate"),
    totalOccurrences: formData.get("totalOccurrences"),
  };

  const validatedData = recurringTransactionSchema.parse(rawData);
  const amountInCents = Math.round(validatedData.amount * 100);

  await db.insert(recurringTransactions).values({
    userId,
    description: validatedData.description,
    amount: amountInCents,
    categoryId: validatedData.categoryId || null,
    type: validatedData.type,
    fromAccountId: validatedData.fromAccountId || null,
    toAccountId: validatedData.toAccountId || null,
    frequency: validatedData.frequency,
    nextRunDate: validatedData.startDate,
    totalOccurrences: validatedData.totalOccurrences || null,
    completedOccurrences: 0,
    active: true,
  });

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function getRecurringTransactions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId));
}

export async function getUpcomingRecurringTransactions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const now = new Date();
  const sevenDaysFromNow = addDays(now, 7);

  const upcoming = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.userId, userId),
        eq(recurringTransactions.active, true)
      )
    )
    .orderBy(recurringTransactions.nextRunDate);

  return upcoming.map(rt => ({
    ...rt,
    isDueToday: rt.nextRunDate <= now,
    isDueSoon: rt.nextRunDate > now && rt.nextRunDate <= sevenDaysFromNow,
    isOverdue: rt.nextRunDate < now,
  }));
}

function calculateNextRunDate(currentDate: Date, frequency: string): Date {
  switch (frequency) {
    case 'daily': return addDays(currentDate, 1);
    case 'weekly': return addWeeks(currentDate, 1);
    case 'monthly': return addMonths(currentDate, 1);
    case 'yearly': return addYears(currentDate, 1);
    default: return currentDate;
  }
}

export async function executeRecurringTransaction(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rt = await db.query.recurringTransactions.findFirst({
    where: and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId))
  });

  if (!rt) throw new Error("Recurring transaction not found");
  if (!rt.active) throw new Error("Recurring transaction is not active");

  // Create the transaction
  await db.transaction(async (tx) => {
    const [newTx] = await tx.insert(transactions).values({
      userId,
      date: new Date(),
      description: rt.description,
      amount: rt.amount,
      categoryId: rt.categoryId,
    }).returning();

    // Create entries based on type
    if (rt.type === 'withdrawal' && rt.fromAccountId) {
      await tx.insert(transactionEntries).values([
        { transactionId: newTx.id, accountId: rt.fromAccountId, type: 'credit', amount: rt.amount },
      ]);
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} - ${rt.amount}` })
        .where(eq(accounts.id, rt.fromAccountId));
    } else if (rt.type === 'deposit' && rt.toAccountId) {
      await tx.insert(transactionEntries).values([
        { transactionId: newTx.id, accountId: rt.toAccountId, type: 'debit', amount: rt.amount },
      ]);
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${rt.amount}` })
        .where(eq(accounts.id, rt.toAccountId));
    } else if (rt.type === 'transfer' && rt.fromAccountId && rt.toAccountId) {
      await tx.insert(transactionEntries).values([
        { transactionId: newTx.id, accountId: rt.fromAccountId, type: 'credit', amount: rt.amount },
        { transactionId: newTx.id, accountId: rt.toAccountId, type: 'debit', amount: rt.amount },
      ]);
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} - ${rt.amount}` })
        .where(eq(accounts.id, rt.fromAccountId));
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${rt.amount}` })
        .where(eq(accounts.id, rt.toAccountId));
    }

    // Update recurring transaction
    const newCompletedOccurrences = rt.completedOccurrences + 1;
    const nextDate = calculateNextRunDate(rt.nextRunDate, rt.frequency);
    const shouldDeactivate = rt.totalOccurrences !== null && newCompletedOccurrences >= rt.totalOccurrences;

    await tx.update(recurringTransactions)
      .set({
        lastRunDate: rt.nextRunDate,
        nextRunDate: nextDate,
        completedOccurrences: newCompletedOccurrences,
        active: !shouldDeactivate,
      })
      .where(eq(recurringTransactions.id, id));
  });

  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function skipRecurringTransaction(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rt = await db.query.recurringTransactions.findFirst({
    where: and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId))
  });

  if (!rt) throw new Error("Recurring transaction not found");

  const nextDate = calculateNextRunDate(rt.nextRunDate, rt.frequency);

  await db.update(recurringTransactions)
    .set({
      nextRunDate: nextDate,
    })
    .where(eq(recurringTransactions.id, id));

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function toggleRecurringTransaction(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rt = await db.query.recurringTransactions.findFirst({
    where: and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId))
  });

  if (!rt) throw new Error("Recurring transaction not found");

  await db.update(recurringTransactions)
    .set({ active: !rt.active })
    .where(eq(recurringTransactions.id, id));

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function deleteRecurringTransaction(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(recurringTransactions)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function updateRecurringTransaction(id: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    frequency: formData.get("frequency"),
    nextRunDate: formData.get("nextRunDate"),
    totalOccurrences: formData.get("totalOccurrences"),
  };

  const updateSchema = z.object({
    description: z.string().min(1),
    amount: z.coerce.number().positive(),
    categoryId: z.coerce.number().optional(),
    fromAccountId: z.coerce.number().optional(),
    toAccountId: z.coerce.number().optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    nextRunDate: z.coerce.date(),
    totalOccurrences: z.preprocess(
      (val) => {
        if (val === "" || val === undefined || val === null) return null;
        return val;
      },
      z.number().int().positive().nullable().optional()
    ),
  });

  const validatedData = updateSchema.parse(rawData);
  const amountInCents = Math.round(validatedData.amount * 100);

  await db.update(recurringTransactions)
    .set({
      description: validatedData.description,
      amount: amountInCents,
      categoryId: validatedData.categoryId || null,
      fromAccountId: validatedData.fromAccountId || null,
      toAccountId: validatedData.toAccountId || null,
      frequency: validatedData.frequency,
      nextRunDate: validatedData.nextRunDate,
      totalOccurrences: validatedData.totalOccurrences || null,
    })
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}
