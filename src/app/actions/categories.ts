"use server";

import { db } from "@/db";
import { 
  categories, 
  transactions, 
  budgets, 
  recurringTransactions, 
  accounts, 
  shortcuts 
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["expense", "revenue"]),
});

export async function createCategory(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    name: formData.get("name"),
    type: formData.get("type"),
  };

  const validatedData = categorySchema.parse(rawData);

  await db.insert(categories).values({
    userId,
    name: validatedData.name,
    type: validatedData.type,
  });

  revalidatePath("/transactions");
}

export async function getCategories() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.select().from(categories).where(eq(categories.userId, userId)).orderBy(desc(categories.createdAt));
}

export async function updateCategory(id: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    name: formData.get("name"),
    type: formData.get("type"),
  };

  const validatedData = categorySchema.parse(rawData);

  await db
    .update(categories)
    .set({
      name: validatedData.name,
      type: validatedData.type,
    })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  revalidatePath("/categories");
  revalidatePath("/transactions");
}

export async function deleteCategory(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Check for dependencies
  
  // 1. Transactions
  const txCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));

  if (txCount[0].count > 0) throw new Error("Cannot delete category used in transactions.");

  // 2. Budgets
  const budgetCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(budgets)
    .where(and(eq(budgets.categoryId, id), eq(budgets.userId, userId)));

  if (budgetCount[0].count > 0) throw new Error("Cannot delete category having a budget.");

  // 3. Recurring Transactions
  const recurringCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(recurringTransactions)
    .where(and(eq(recurringTransactions.categoryId, id), eq(recurringTransactions.userId, userId)));

  if (recurringCount[0].count > 0) throw new Error("Cannot delete category used in recurring transactions.");

  // 4. Accounts (Default Category)
  const accountCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(accounts)
    .where(and(eq(accounts.defaultCategoryId, id), eq(accounts.userId, userId)));

  if (accountCount[0].count > 0) throw new Error("Cannot delete category used as default for an account.");

  // 5. Shortcuts
  const shortcutCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(shortcuts)
    .where(and(eq(shortcuts.categoryId, id), eq(shortcuts.userId, userId)));

  if (shortcutCount[0].count > 0) throw new Error("Cannot delete category used in shortcuts.");

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  revalidatePath("/transactions");
}
