"use server";

import { db } from "@/db";
import {
  transactions,
  transactionEntries,
  accounts,
  goals,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, sql, and } from "drizzle-orm";
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

export async function getTransactions(page: number = 1, pageSize: number = 10) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const offset = (page - 1) * pageSize;

  const data = await db.query.transactions.findMany({
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
    limit: pageSize,
    offset: offset,
  });

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.userId, userId));

  const totalCount = Number(countResult.count);
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    meta: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
  };
}

export async function updateTransaction(id: number, formData: FormData) {
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

  await db.transaction(async (tx) => {
    // 1. Fetch existing transaction and entries to reverse them
    const existingTransaction = await tx.query.transactions.findFirst({
      where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
      with: {
        entries: {
          with: { account: true },
        },
      },
    });

    if (!existingTransaction) throw new Error("Transaction not found");

    // 2. Reverse effects of old entries
    for (const entry of existingTransaction.entries) {
      if (!entry.account) continue;

      // Liability/Revenue: Credit increases balance, Debit decreases balance (usually, but we store absolute balance. 
      // For Liability: Credit = Added debt (Increase balance number). Debit = Paid off (Decrease balance number). 
      // For Revenue: Credit = Added revenue. Debit = Refund.
      // So effectively: Liability/Revenue behave same as Asset/Expense regarding balance NUMBER?
      // Wait. 
      // Asset: Debit (+), Credit (-)
      // Liability: Credit (+), Debit (-)  <-- Same sign for "Increasing the account magnitude"
      // However, we need to be careful with the implementation in createTransaction.
      
      // Checking createTransaction logic:
      // Asset Credit: balance - amount
      // Liability Credit: NOT USED usually for "from". 
      // Withdrawal (Credit From):
      //   Asset: balance - amount
      //   Liability: balance + amount (Increasing debt)
      
      // So Liability behaves OPPOSITE to Asset for Credit.
      // Asset Credit = Decrease. Liability Credit = Increase.
      
      let amountChange = 0;
      
      if (entry.type === "credit") {
        if (entry.account.type === "asset") {
           // Was Decrease, so Reverse is Increase (+)
           amountChange = entry.amount;
        } else if (entry.account.type === "liability") {
           // Was Increase, so Reverse is Decrease (-)
           amountChange = -entry.amount;
        } else if (entry.account.type === "revenue") {
           // Was Increase, so Reverse is Decrease (-)
           amountChange = -entry.amount;
        } else { // expense
           // Expense Credit (refund?): Decrease. Reverse is Increase (+)
           amountChange = entry.amount;
        }
      } else { // DEBIT
        if (entry.account.type === "asset") {
           // Was Increase, so Reverse is Decrease (-)
           amountChange = -entry.amount;
        } else if (entry.account.type === "liability") {
           // Was Decrease (payment), so Reverse is Increase (+)
           amountChange = entry.amount;
        } else if (entry.account.type === "revenue") {
            // Debit Revenue (decrease): Reverse is Increase (+)
            amountChange = entry.amount;
        } else { // expense
           // Expense Debit (spend): Increase. Reverse is Decrease (-)
           amountChange = -entry.amount;
        }
      }

      if (amountChange !== 0) {
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${amountChange}`,
          })
          .where(eq(accounts.id, entry.accountId));
      }
    }

    // 3. Delete old entries
    await tx.delete(transactionEntries).where(eq(transactionEntries.transactionId, id));

    // 4. Update Transaction Record
    await tx
      .update(transactions)
      .set({
        date: validatedData.date,
        description: validatedData.description,
        amount: amountInCents,
        categoryId: validatedData.categoryId,
      })
      .where(eq(transactions.id, id));

    // 5. Re-apply new entries (Same logic as Create)
    // Reuse logic by copying code? Or refactor? 
    // For now, I'll copy the logic to ensure stability involved in this refactor.
    
    // ... Logic from createTransaction ...
    // Note: createTransaction uses 'newTransaction.id'. We use 'id'.
    // Also validatedData contains the new values.
    
    if (validatedData.type === "withdrawal") {
        // Entry 1: Credit From Account
        await tx.insert(transactionEntries).values({
            transactionId: id,
            accountId: validatedData.fromAccountId,
            type: "credit",
            amount: amountInCents,
        });

        const fromAccount = await tx.query.accounts.findFirst({
            where: eq(accounts.id, validatedData.fromAccountId),
        });
        if (!fromAccount) throw new Error("fromAccount not found");

        if (fromAccount.type === "asset") {
            await tx.update(accounts)
            .set({ balance: sql`${accounts.balance} - ${amountInCents}` })
            .where(eq(accounts.id, validatedData.fromAccountId));
        } else if (fromAccount.type === "liability") {
            await tx.update(accounts)
            .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
            .where(eq(accounts.id, validatedData.fromAccountId));
        }

        // Entry 2: Debit To Account
        if (!validatedData.toAccountId) throw new Error("Destination account required");

        await tx.insert(transactionEntries).values({
            transactionId: id,
            accountId: validatedData.toAccountId,
            type: "debit",
            amount: amountInCents,
        });

        await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
        .where(eq(accounts.id, validatedData.toAccountId));

    } else if (validatedData.type === "deposit") {
        if (!validatedData.toAccountId) throw new Error("Destination account required");

        // Credit Revenue
        await tx.insert(transactionEntries).values({
            transactionId: id,
            accountId: validatedData.fromAccountId,
            type: "credit",
            amount: amountInCents,
        });

        await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
        .where(eq(accounts.id, validatedData.fromAccountId));

        // Debit Asset
        await tx.insert(transactionEntries).values({
            transactionId: id,
            accountId: validatedData.toAccountId,
            type: "debit",
            amount: amountInCents,
        });

        await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
        .where(eq(accounts.id, validatedData.toAccountId));

    } else if (validatedData.type === "transfer") {
        if (!validatedData.toAccountId) throw new Error("Destination account required");
        
        const fromAccount = await tx.query.accounts.findFirst({
             where: eq(accounts.id, validatedData.fromAccountId),
        });
        const toAccount = await tx.query.accounts.findFirst({
             where: eq(accounts.id, validatedData.toAccountId),
        });

        if (!fromAccount || !toAccount) throw new Error("Account not found");

        // Credit From
        await tx.insert(transactionEntries).values({
            transactionId: id,
            accountId: validatedData.fromAccountId,
            type: "credit",
            amount: amountInCents,
        });

        if (fromAccount.type === "asset") {
            await tx.update(accounts)
            .set({ balance: sql`${accounts.balance} - ${amountInCents}` })
            .where(eq(accounts.id, validatedData.fromAccountId));
        } else if (fromAccount.type === "liability") {
            await tx.update(accounts)
            .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
            .where(eq(accounts.id, validatedData.fromAccountId));
        }

        // Debit To
        await tx.insert(transactionEntries).values({
            transactionId: id,
            accountId: validatedData.toAccountId,
            type: "debit",
            amount: amountInCents,
        });

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

export async function deleteTransaction(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.transaction(async (tx) => {
    // 1. Fetch existing transaction and entries to reverse them
    const existingTransaction = await tx.query.transactions.findFirst({
      where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
      with: {
        entries: {
          with: { account: true },
        },
      },
    });

    if (!existingTransaction) throw new Error("Transaction not found");

    // 2. Reverse effects of entries
    for (const entry of existingTransaction.entries) {
      if (!entry.account) continue;

      let amountChange = 0;
      
      if (entry.type === "credit") {
        if (entry.account.type === "asset") {
           // Was Decrease, so Reverse is Increase (+)
           amountChange = entry.amount;
        } else if (entry.account.type === "liability") {
           // Was Increase, so Reverse is Decrease (-)
           amountChange = -entry.amount;
        } else if (entry.account.type === "revenue") {
           // Was Increase, so Reverse is Decrease (-)
           amountChange = -entry.amount;
        } else { // expense
           // Expense Credit (refund?): Decrease. Reverse is Increase (+)
           amountChange = entry.amount;
        }
      } else { // DEBIT
        if (entry.account.type === "asset") {
           // Was Increase, so Reverse is Decrease (-)
           amountChange = -entry.amount;
        } else if (entry.account.type === "liability") {
           // Was Decrease (payment), so Reverse is Increase (+)
           amountChange = entry.amount;
        } else if (entry.account.type === "revenue") {
            // Debit Revenue (decrease): Reverse is Increase (+)
            amountChange = entry.amount;
        } else { // expense
           // Expense Debit (spend): Increase. Reverse is Decrease (-)
           amountChange = -entry.amount;
        }
      }

      if (amountChange !== 0) {
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${amountChange}`,
          })
          .where(eq(accounts.id, entry.accountId));

        // Sync Goal Amount if this account belongs to a goal
        // amountChange is the "correction" applied to the balance.
        // If we deleted a contribution (Debit), amountChange is negative (Reducing balance).
        // So we reduce the goal amount by the same value.
        await tx
            .update(goals)
            .set({
                currentAmount: sql`${goals.currentAmount} + ${amountChange}`
            })
            .where(eq(goals.accountId, entry.accountId));
      }
    }

    // 3. Delete transaction
    await tx.delete(transactions).where(eq(transactions.id, id));
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
