/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/db";
import {
  accounts,
  categories,
  transactions,
  transactionEntries,
  budgets,
  goals,
  userSettings,
  recurringTransactions,
  shortcuts,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, InferInsertModel } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface BackupData {
  version: number;
  timestamp: string;
  data: {
    userSettings: any;
    accounts: any[];
    categories: any[];
    transactions: any[];
    transactionEntries: any[];
    budgets: any[];
    goals: any[];
    recurringTransactions: any[];
    shortcuts: any[];
  };
}

export async function exportData(): Promise<BackupData> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [
    userSettingsData,
    accountsData,
    categoriesData,
    transactionsData,
    transactionEntriesData,
    budgetsData,
    goalsData,
    recurringTransactionsData,
    shortcutsData,
  ] = await Promise.all([
    db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) }),
    db.query.accounts.findMany({ where: eq(accounts.userId, userId) }),
    db.query.categories.findMany({ where: eq(categories.userId, userId) }),
    db.query.transactions.findMany({ where: eq(transactions.userId, userId) }),
    // Entries don't have userId directly, but we can verify ownership or fetch via transaction IDs if needed.
    // However, for simplicity and since we are backing up *everything* for the user, 
    // fetching all entries where the associated transaction belongs to the user is safer.
    // But typically entries are strictly tied to transactions/accounts which are tied to users.
    // Let's rely on a join or filtered fetch if possible, or just fetch all for now if we trust relation integrity 
    // (Drizzle query builder is easier with relations). 
    // Actually, let's just fetch entries by joining with transactions to be safe and correct.
    db
      .select({
        id: transactionEntries.id,
        transactionId: transactionEntries.transactionId,
        accountId: transactionEntries.accountId,
        type: transactionEntries.type,
        amount: transactionEntries.amount,
      })
      .from(transactionEntries)
      .innerJoin(transactions, eq(transactionEntries.transactionId, transactions.id))
      .where(eq(transactions.userId, userId)),
    db.query.budgets.findMany({ where: eq(budgets.userId, userId) }),
    db.query.goals.findMany({ where: eq(goals.userId, userId) }),
    db.query.recurringTransactions.findMany({ where: eq(recurringTransactions.userId, userId) }),
    db.query.shortcuts.findMany({ where: eq(shortcuts.userId, userId) }),
  ]);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    data: {
      userSettings: userSettingsData || null,
      accounts: accountsData,
      categories: categoriesData,
      transactions: transactionsData,
      transactionEntries: transactionEntriesData,
      budgets: budgetsData,
      goals: goalsData,
      recurringTransactions: recurringTransactionsData,
      shortcuts: shortcutsData,
    },
  };
}

export async function importData(backup: BackupData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!backup || !backup.data || backup.version !== 1) {
    throw new Error("Invalid backup file format");
  }

  const {
    userSettings: userSettingsData,
    accounts: accountsData,
    categories: categoriesData,
    transactions: transactionsData,
    transactionEntries: transactionEntriesData,
    budgets: budgetsData,
    goals: goalsData,
    recurringTransactions: recurringTransactionsData,
    shortcuts: shortcutsData,
  } = backup.data;

  // Use a transaction to ensure atomicity
  await db.transaction(async (tx) => {
    // 1. DELETE EXISTING DATA (Reverse dependency order)
    // entries -> transactions
    // budgets -> categories
    // shortcuts -> accounts/categories
    // recurring -> accounts/categories
    // goals -> accounts
    // accounts
    // categories
    // user_settings
    
    // We need to delete transaction entries first.
    // Since we don't have a direct userId on entries, we delete based on transaction join, 
    // OR we just delete transactions and let CASCADE handle entries (if set up).
    // Looking at schema: transactionId: integer('transaction_id').references(() => transactions.id, { onDelete: 'cascade' })
    // So deleting transactions is sufficient to delete entries.
    
    await tx.delete(shortcuts).where(eq(shortcuts.userId, userId));
    await tx.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));
    await tx.delete(goals).where(eq(goals.userId, userId));
    await tx.delete(budgets).where(eq(budgets.userId, userId));
    
    // Deleting transactions will cascade to entries
    await tx.delete(transactions).where(eq(transactions.userId, userId));
    
    // accounts and categories might refer to each other.
    // Accounts refer to defaultCategoryId.
    // Transactions refer to categoryId.
    // Budgets refer to categoryId.
    // Recurring refer to categoryId etc.
    // We have deleted most dependents.
    
    // Accounts depends on Categories (defaultCategoryId).
    // BUT Categories don't depend on Accounts.
    // So we should delete Accounts first? 
    // Wait, transactions also depend on Accounts. We deleted transactions.
    
    // So order:
    // 1. Dependents of Accounts/Categories (Done: shortcuts, recurring, goals, budgets, transactions)
    // 2. Accounts (has FK to Categories)
    // 3. Categories
    // 4. UserSettings
    
    await tx.delete(accounts).where(eq(accounts.userId, userId));
    await tx.delete(categories).where(eq(categories.userId, userId));
    await tx.delete(userSettings).where(eq(userSettings.userId, userId));


    // 2. INSERT NEW DATA (Dependency order)
    
    // 1. Categories (Independent mostly)
    if (categoriesData?.length > 0) {
        // We must ensure that we map the IDs correctly OR preserve them.
        // Preserving IDs is easiest for restoration but risks collisions if we didn't wipe cleanly (we did).
        // Since we are restoring to the SAME user and wiped everything, we can try to insert with specific IDs.
        // Drizzle/Postgres usually allows inserting explicit IDs.
        await tx.insert(categories).values(categoriesData.map((d: any) => ({ 
            ...d, 
            userId,
            createdAt: new Date(d.createdAt) 
        })));
    }

    // 2. User Settings
    if (userSettingsData) {
        await tx.insert(userSettings).values({ 
            ...userSettingsData, 
            userId,
            createdAt: new Date(userSettingsData.createdAt),
            updatedAt: new Date(userSettingsData.updatedAt)
        });
    }

    // 3. Accounts (Depends on Categories if defaultCategoryId is present)
    if (accountsData?.length > 0) {
        await tx.insert(accounts).values(accountsData.map((d: any) => ({
            ...d, 
            userId,
            // Ensure dates are converted back to Date objects if they are strings
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt),
            dueDate: d.dueDate ? new Date(d.dueDate) : null,
        })));
    }

    // 4. Transactions (Depends on Categories)
    if (transactionsData?.length > 0) {
        await tx.insert(transactions).values(transactionsData.map((d: any) => ({
            ...d,
            userId,
            date: new Date(d.date),
            createdAt: new Date(d.createdAt),
        })));
    }

    // 5. Transaction Entries (Depends on Transactions AND Accounts)
    if (transactionEntriesData?.length > 0) {
        await tx.insert(transactionEntries).values(transactionEntriesData);
    }
    
    // 6. Budgets (Depends on Categories)
    if (budgetsData?.length > 0) {
        await tx.insert(budgets).values(budgetsData.map((d: any) => ({
             ...d, 
             userId,
             createdAt: new Date(d.createdAt),
        })));
    }

    // 7. Goals (Depends on Accounts)
    if (goalsData?.length > 0) {
        await tx.insert(goals).values(goalsData.map((d: any) => ({
            ...d,
            userId,
            createdAt: new Date(d.createdAt),
        })));
    }

    // 8. Recurring (Depends on Accounts, Categories)
    if (recurringTransactionsData?.length > 0) {
        await tx.insert(recurringTransactions).values(recurringTransactionsData.map((d: any) => ({
            ...d,
            userId,
            nextRunDate: new Date(d.nextRunDate),
            lastRunDate: d.lastRunDate ? new Date(d.lastRunDate) : null,
            createdAt: new Date(d.createdAt),
        })));
    }

    // 9. Shortcuts (Depends on Accounts, Categories)
    if (shortcutsData?.length > 0) {
        await tx.insert(shortcuts).values(shortcutsData.map((d: any) => ({
             ...d, 
             userId,
             createdAt: new Date(d.createdAt),
        })));
    }
  });

  revalidatePath("/");
  return { success: true };
}
