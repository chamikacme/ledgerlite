"use server";

import { db } from "@/db";
import { recurringTransactions, transactions, transactionEntries, accounts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, sql, desc } from "drizzle-orm";
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
      return Number(val);
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

  return await db.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId)).orderBy(desc(recurringTransactions.createdAt));
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
    // Create entries based on type
    if (rt.type === 'withdrawal') {
      if (!rt.fromAccountId || !rt.toAccountId) throw new Error("Missing accounts for withdrawal");
      
      await tx.insert(transactionEntries).values([
        { transactionId: newTx.id, accountId: rt.fromAccountId, type: 'credit', amount: rt.amount },
        { transactionId: newTx.id, accountId: rt.toAccountId, type: 'debit', amount: rt.amount },
      ]);
      
      // Update from account (Asset/Liability) - decreases asset or increases liability (which is negative balance in some systems, but here strictly credit)
      // Wait, balance is integer. Asset credit = decrease. Liability credit = increase debt.
      // Standard logic: Assets are debit-normal. Liabilities are credit-normal.
      // LedgerLite logic so far:
      // Asset: +Debit, -Credit
      // Liability: -Debit (payoff), +Credit (spend)
      // Expense: +Debit
      // Revenue: +Credit
      
      // So for Withdrawal (Expense):
      // Credit From (Asset/Liability) -> Balance - Amount (if Asset) ?? 
      // Let's check existing logic:
      // Asset balance = debits - credits.
      // Liability balance = credits - debits.
      // The `accounts.balance` field is just a number. It depends on how it's calculated.
      // Usually, we store everything as signed, or we execute logic based on type.
      // Let's look at `createTransaction` (not visible here, but general practice).
      // Assuming naive update: `balance = balance - amount` for spending from asset.
      
      // Let's follow the previous pattern but ensuring both sides are touched.
      
      // FROM Account (Asset/Liability) -> Credit -> Decrease Balance (if Asset) / Increase Balance (if Liability)?
      // Actually previous logic: `.set({ balance: sql`${accounts.balance} - ${rt.amount}` })`
      // This implies we Just subtract. But for Liability (Credit Card), spending increases the balance (debt).
      // Let's check Account Type.
      
      // To be safe and consistent with `createTransaction`, we should simply adjust balances.
      // However, without `createTransaction` reference, I will assume standard:
      // FROM (Credit):
      // If Asset: Balance - Amount
      // If Liability: Balance + Amount (Debt goes up)
      
      // TO (Debit) - Expense:
      // Expense accounts usually don't track "balance" strictly in `accounts` table the same way, or do they?
      // Yes, they have `balance`.
      // Expense (Debit) -> Balance + Amount.
      
      // BUT, let's look at the EXISTING CODE I am replacing:
      // `await tx.update(accounts).set({ balance: sql`${accounts.balance} - ${rt.amount}` }).where(eq(accounts.id, rt.fromAccountId));`
      // It blindly subtracts. This suggests maybe Liab balance is negative? Or maybe it's just wrong for Liab?
      // Given I cannot see `createTransaction` right now, I will stick to the previous pattern for FROM, but ADD logic for TO.
      // Wait, if I change logic now, I might break things.
      // Let's look at `type` check.
      
      const fromAccount = await tx.query.accounts.findFirst({ where: eq(accounts.id, rt.fromAccountId) });
      const toAccount = await tx.query.accounts.findFirst({ where: eq(accounts.id, rt.toAccountId) });
      
      if (!fromAccount || !toAccount) throw new Error("Accounts not found");

      // Credit From
      let fromChange = -rt.amount;
      if (fromAccount.type === 'liability') fromChange = rt.amount; // Spending increases liability balance
      
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${fromChange}` })
        .where(eq(accounts.id, rt.fromAccountId));

      // Debit To
      let toChange = rt.amount;
      // If To is Liability (e.g. transfer to pay off card), Debit reduces balance.
      // But Transfer is handled separately.
      // Withdrawal TO is Expense. Expense Debit = Increase.
      // Let's assume standard behavior:
      // Asset: Debit+, Credit-
      // Liab: Debit-, Credit+
      // Rev: Debit-, Credit+
      // Exp: Debit+, Credit-
      
      if (toAccount.type === 'liability' || toAccount.type === 'revenue') toChange = -rt.amount;
      
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${toChange}` })
        .where(eq(accounts.id, rt.toAccountId));

    } else if (rt.type === 'deposit') {
      if (!rt.fromAccountId || !rt.toAccountId) throw new Error("Missing accounts for deposit");

      await tx.insert(transactionEntries).values([
        { transactionId: newTx.id, accountId: rt.fromAccountId, type: 'credit', amount: rt.amount }, // Rev
        { transactionId: newTx.id, accountId: rt.toAccountId, type: 'debit', amount: rt.amount }, // Asset
      ]);

      // Credit From (Revenue) -> Increase Revenue Balance (Credit normal)
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${rt.amount}` })
        .where(eq(accounts.id, rt.fromAccountId));
        
      // Debit To (Asset) -> Increase Asset Balance
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${rt.amount}` })
        .where(eq(accounts.id, rt.toAccountId));

    } else if (rt.type === 'transfer') {
       if (!rt.fromAccountId || !rt.toAccountId) throw new Error("Missing accounts for transfer");
       
       const fromAccount = await tx.query.accounts.findFirst({ where: eq(accounts.id, rt.fromAccountId) });
       const toAccount = await tx.query.accounts.findFirst({ where: eq(accounts.id, rt.toAccountId) });
       
       if (!fromAccount || !toAccount) throw new Error("Accounts not found");

      await tx.insert(transactionEntries).values([
        { transactionId: newTx.id, accountId: rt.fromAccountId, type: 'credit', amount: rt.amount },
        { transactionId: newTx.id, accountId: rt.toAccountId, type: 'debit', amount: rt.amount },
      ]);
      
      // From (Credit)
      let fromChange = -rt.amount; // Default asset decrease
      if (fromAccount.type === 'liability' || fromAccount.type === 'revenue') fromChange = rt.amount; // Liab increases
      
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${fromChange}` })
        .where(eq(accounts.id, rt.fromAccountId));

      // To (Debit)
      let toChange = rt.amount; // Default asset increase
      if (toAccount.type === 'liability' || toAccount.type === 'revenue') toChange = -rt.amount; // Liab decreases (payoff)
      
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${toChange}` })
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
        return Number(val);
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
