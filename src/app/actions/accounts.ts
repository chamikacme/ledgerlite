"use server";

import { db } from "@/db";
import { 
  accounts, 
  userSettings, 
  transactionEntries, 
  transactions, 
  goals,
  recurringTransactions,
  shortcuts
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc, asc, sql, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["asset", "liability", "expense", "revenue"]),
  balance: z.coerce.number().default(0), // Input as dollars, convert to cents
  currency: z.string().default("LKR"),
  statementBalance: z.coerce.number().optional(),
  dueDate: z.coerce.date().optional(),
  defaultCategoryId: z.coerce.number().optional(),
});

export async function createAccount(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    currency: formData.get("currency"),
    statementBalance: formData.get("statementBalance"),
    dueDate: formData.get("dueDate"),
    defaultCategoryId: formData.get("defaultCategoryId"),
  };

  const validatedData = accountSchema.parse(rawData);

  // Convert balance to cents
  const balanceInCents = Math.round(validatedData.balance * 100);
  const statementBalanceInCents = validatedData.statementBalance ? Math.round(validatedData.statementBalance * 100) : null;

  await db.insert(accounts).values({
    userId,
    name: validatedData.name,
    type: validatedData.type,
    balance: balanceInCents,
    currency: validatedData.currency,
    statementBalance: statementBalanceInCents,
    dueDate: validatedData.dueDate,
    defaultCategoryId: validatedData.defaultCategoryId || null,
  });

  revalidatePath("/accounts");
}

export async function getAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.select().from(accounts).where(eq(accounts.userId, userId)).orderBy(desc(accounts.updatedAt));
}

export async function getPaginatedAccounts(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  sortBy: string = "updatedAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Filter out accounts linked to completed goals
  const userGoals = await db
    .select({ accountId: goals.accountId, completed: goals.completed })
    .from(goals)
    .where(eq(goals.userId, userId));
    
  const completedGoalAccountIds = userGoals
    .filter(g => g.completed && g.accountId)
    .map(g => g.accountId as number);

  const offset = (page - 1) * pageSize;
  
  const conditions = [
     eq(accounts.userId, userId),
     completedGoalAccountIds.length > 0 ? sql`${accounts.id} NOT IN ${completedGoalAccountIds}` : undefined,
  ];

  if (search) {
    conditions.push(ilike(accounts.name, `%${search}%`));
  }

  const whereCondition = and(...conditions);

  let orderBy;
  switch (sortBy) {
    case "name":
      orderBy = sortOrder === "asc" ? asc(accounts.name) : desc(accounts.name);
      break;
    case "type":
      orderBy = sortOrder === "asc" ? asc(accounts.type) : desc(accounts.type);
      break;
    case "balance":
        orderBy = sortOrder === "asc" ? asc(accounts.balance) : desc(accounts.balance);
        break;
    default:
      orderBy = sortOrder === "asc" ? asc(accounts.updatedAt) : desc(accounts.updatedAt);
  }

  const data = await db
    .select()
    .from(accounts)
    .where(whereCondition)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);
    
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(accounts)
    .where(whereCondition);

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

export async function updateAccount(id: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    currency: formData.get("currency"),
    statementBalance: formData.get("statementBalance"),
    dueDate: formData.get("dueDate"),
    defaultCategoryId: formData.get("defaultCategoryId"),
  };

  const validatedData = accountSchema.parse(rawData);

  // Convert balance to cents
  const balanceInCents = Math.round(validatedData.balance * 100);
  const statementBalanceInCents = validatedData.statementBalance ? Math.round(validatedData.statementBalance * 100) : null;

  await db
    .update(accounts)
    .set({
      name: validatedData.name,
      type: validatedData.type,
      balance: balanceInCents,
      currency: validatedData.currency,
      statementBalance: statementBalanceInCents,
      dueDate: validatedData.dueDate || null,
      defaultCategoryId: validatedData.defaultCategoryId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function deleteAccount(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Check for dependencies
  // 1. Transaction Entries
  const entriesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactionEntries)
    .innerJoin(transactions, eq(transactionEntries.transactionId, transactions.id))
    .where(and(eq(transactionEntries.accountId, id), eq(transactions.userId, userId))); // Ensure we check user's data

  if (entriesCount[0].count > 0) {
    throw new Error("Cannot delete account with existing transactions.");
  }

  // 2. Goals (linked account)
  const goalsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(goals)
    .where(and(eq(goals.accountId, id), eq(goals.userId, userId)));

  if (goalsCount[0].count > 0) {
    throw new Error("Cannot delete account linked to a goal/piggy bank.");
  }

  // 3. Recurring Transactions
  // Need to check fromAccountId and toAccountId
  const recurringCount = await db
     .select({ count: sql<number>`count(*)` })
     .from(recurringTransactions)
     .where(and(
         // Check if account is used in FROM or TO
         // Use OR condition with SQL injection or simple many fetches.
         // Since Drizzle OR needs complex imports, let's use SQL or multiple queries.
         // Actually we can use:
         sql`(${recurringTransactions.fromAccountId} = ${id} OR ${recurringTransactions.toAccountId} = ${id})`,
         eq(recurringTransactions.userId, userId)
     ));
  
   if (recurringCount[0].count > 0) {
     throw new Error("Cannot delete account used in recurring transactions.");
   }

   // 4. Shortcuts
   const shortcutsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(shortcuts)
      .where(and(
         sql`(${shortcuts.fromAccountId} = ${id} OR ${shortcuts.toAccountId} = ${id})`,
         eq(shortcuts.userId, userId)
      ));

   if (shortcutsCount[0].count > 0) {
      throw new Error("Cannot delete account used in shortcuts.");
   }

  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

  revalidatePath("/accounts");
}

export async function togglePinAccount(id: number, isPinned: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(accounts)
    .set({ isPinned, updatedAt: new Date() })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function getUserSettings() {
  const { userId } = await auth();
  if (!userId) return null;

  const settings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return settings[0] || null;
}

export async function updateUserSettings(updates: {
  currency?: string;
  showNetWorth?: boolean;
  showMonthlySpending?: boolean;
  showDefinedNetWorth?: boolean;
  definedNetWorthIncludes?: number[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await getUserSettings();

  if (existing) {
    await db
      .update(userSettings)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({
      userId,
      currency: updates.currency || "USD",
      showNetWorth: updates.showNetWorth ?? true,
      showMonthlySpending: updates.showMonthlySpending ?? true,
      showDefinedNetWorth: updates.showDefinedNetWorth ?? false,
      definedNetWorthIncludes: updates.definedNetWorthIncludes ?? [],
    });
  }
  
  revalidatePath("/");
}
