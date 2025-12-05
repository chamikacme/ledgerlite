"use server";

import { db } from "@/db";
import {
  transactions,
  transactionEntries,
  accounts,
  categories,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const transactionSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.coerce.number().optional(),
  type: z.enum(["withdrawal", "deposit", "transfer"]),
  fromAccountId: z.coerce.number(),
  toAccountId: z.coerce.number().optional(), // Required for transfer
});

export async function createTransaction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId") || undefined,
    type: formData.get("type"),
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId") || undefined,
  };

  const validatedData = transactionSchema.parse(rawData);
  const amountInCents = Math.round(validatedData.amount * 100);

  // Start transaction
  await db.transaction(async (tx) => {
    // 1. Create Transaction Record
    const [newTransaction] = await tx
      .insert(transactions)
      .values({
        userId,
        date: validatedData.date,
        description: validatedData.description,
        amount: amountInCents,
        categoryId: validatedData.categoryId,
      })
      .returning();

    // 2. Create Double Entries based on type
    if (validatedData.type === "withdrawal") {
      // Asset (Credit) -> Expense (Debit)
      // Wait, in double entry:
      // Expense is Debited (increased)
      // Asset is Credited (decreased)
      
      // But for our simplified schema, we link to accounts.
      // If we don't have an "Expense Account" entity for every category, 
      // we might just treat the category as the destination or implied account.
      // However, the requirements say "Asset -> Expense (or Liability)".
      // Let's assume 'fromAccountId' is the Asset account.
      
      // Entry 1: Credit the From Account
      await tx.insert(transactionEntries).values({
        transactionId: newTransaction.id,
        accountId: validatedData.fromAccountId,
        type: "credit",
        amount: amountInCents,
      });

      // Get FROM account to check type
      const fromAccount = await tx.query.accounts.findFirst({
        where: eq(accounts.id, validatedData.fromAccountId),
      });

      if (!fromAccount) throw new Error("Account not found");

      // Update Account Balance based on type
      // Asset: decrease (money leaving)
      // Liability: INCREASE (debt increasing - you're charging the card)
      if (fromAccount.type === "asset") {
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} - ${amountInCents}` })
          .where(eq(accounts.id, validatedData.fromAccountId));
      } else if (fromAccount.type === "liability") {
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
          .where(eq(accounts.id, validatedData.fromAccountId));
      }

      // We don't strictly need a second entry if we don't track Expense Accounts as rows in 'accounts' table.
      // But for strict double entry, we should. 
      // The requirements said: "Support four core account types: Asset, Liability, Expense, Revenue".
      // So users should create Expense Accounts? Or are Categories mapped to Expense Accounts?
      // "Create & manage accounts... Asset, Liability, Expense, Revenue".
      // So yes, there should be an Expense Account.
      
      // Ideally, the user selects an Expense Account as the 'to' account.
      // But often users just select a Category.
      // Let's assume for MVP: Withdrawal = Credit Asset, Debit Expense Account (if selected) or just track Category.
      // BUT, to satisfy "Double-Entry System", we need two entries.
      // If the user selects a Category, maybe we auto-create or find a generic Expense Account?
      // OR, the form should ask for "From Account" and "To Account" (where To is an Expense Account).
      
      // Let's enforce "To Account" for all types to keep it pure double-entry.
      // For Withdrawal: From = Asset, To = Expense Account.
      
      if (!validatedData.toAccountId) throw new Error("Destination account required");

      await tx.insert(transactionEntries).values({
        transactionId: newTransaction.id,
        accountId: validatedData.toAccountId,
        type: "debit",
        amount: amountInCents,
      });

       // Update Destination Account Balance (Expense accounts increase with Debit)
       // For Expense/Asset: Debit = Increase.
       // For Liability/Revenue: Credit = Increase.
       // Wait, Expense Debit increases the "Expense" balance (amount spent).
       // So yes, add to balance.
       await tx
       .update(accounts)
       .set({
         balance: sql`${accounts.balance} + ${amountInCents}`,
       })
       .where(eq(accounts.id, validatedData.toAccountId));

    } else if (validatedData.type === "deposit") {
      // Revenue (Credit) -> Asset (Debit)
      // From = Revenue Account, To = Asset Account.
      
      if (!validatedData.toAccountId) throw new Error("Destination account required");
      
      // Entry 1: Credit Revenue Account (Increase Revenue)
      // Revenue increases on Credit.
      await tx.insert(transactionEntries).values({
        transactionId: newTransaction.id,
        accountId: validatedData.fromAccountId,
        type: "credit",
        amount: amountInCents,
      });

      await tx
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${amountInCents}`,
        })
        .where(eq(accounts.id, validatedData.fromAccountId));

      // Entry 2: Debit Asset Account (Increase Asset)
      await tx.insert(transactionEntries).values({
        transactionId: newTransaction.id,
        accountId: validatedData.toAccountId,
        type: "debit",
        amount: amountInCents,
      });

      await tx
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${amountInCents}`,
        })
        .where(eq(accounts.id, validatedData.toAccountId));

    } else if (validatedData.type === "transfer") {
      // Transfer can be:
      // Asset -> Asset: Normal transfer
      // Asset -> Liability: Paying off debt (decrease liability)
      // Liability -> Asset: Cash advance (increase cash, increase debt)
      // Liability -> Liability: Balance transfer
      
      if (!validatedData.toAccountId) throw new Error("Destination account required");

      // Get account types to determine if we're dealing with liabilities
      const fromAccount = await tx.query.accounts.findFirst({
        where: eq(accounts.id, validatedData.fromAccountId),
      });
      
      const toAccount = await tx.query.accounts.findFirst({
        where: eq(accounts.id, validatedData.toAccountId),
      });

      if (!fromAccount || !toAccount) throw new Error("Account not found");

      // Entry 1: Credit From Account (money leaving)
      await tx.insert(transactionEntries).values({
        transactionId: newTransaction.id,
        accountId: validatedData.fromAccountId,
        type: "credit",
        amount: amountInCents,
      });

      // Update FROM account balance
      // For Asset: decrease (money leaving)
      // For Liability: increase (debt increasing if cash advance)
      if (fromAccount.type === "asset") {
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} - ${amountInCents}` })
          .where(eq(accounts.id, validatedData.fromAccountId));
      } else if (fromAccount.type === "liability") {
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
          .where(eq(accounts.id, validatedData.fromAccountId));
      }

      // Entry 2: Debit To Account (money arriving)
      await tx.insert(transactionEntries).values({
        transactionId: newTransaction.id,
        accountId: validatedData.toAccountId,
        type: "debit",
        amount: amountInCents,
      });

      // Update TO account balance
      // For Asset: increase (money arriving)
      // For Liability: DECREASE (debt being paid off)
      if (toAccount.type === "asset") {
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
          .where(eq(accounts.id, validatedData.toAccountId));
      } else if (toAccount.type === "liability") {
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} - ${amountInCents}` })
          .where(eq(accounts.id, validatedData.toAccountId));
      }
    }
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function getTransactions() {
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
    orderBy: [desc(transactions.date)],
  });
}
