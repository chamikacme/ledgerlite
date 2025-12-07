"use server";

import { db } from "@/db";
import { budgets, transactions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const budgetSchema = z.object({
  categoryId: z.coerce.number(),
  amount: z.coerce.number().positive("Amount must be positive"),
  period: z.enum(["monthly"]),
});

export async function createBudget(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    period: formData.get("period"),
  };

  const validatedData = budgetSchema.parse(rawData);
  const amountInCents = Math.round(validatedData.amount * 100);

  // Check if budget already exists for this category
  const existingBudget = await db.query.budgets.findFirst({
    where: and(
        eq(budgets.categoryId, validatedData.categoryId),
        eq(budgets.userId, userId)
    )
  });

  if (existingBudget) {
      await db.update(budgets)
        .set({ amount: amountInCents })
        .where(eq(budgets.id, existingBudget.id));
  } else {
      await db.insert(budgets).values({
        userId,
        categoryId: validatedData.categoryId,
        amount: amountInCents,
        period: validatedData.period,
      });
  }

  revalidatePath("/budgets");
}

export async function getBudgets() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const budgetsData = await db.query.budgets.findMany({
    where: eq(budgets.userId, userId),
    with: {
      category: true,
    },
    orderBy: [desc(budgets.createdAt)],
  });

  // Calculate spent amount for each budget in the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const budgetsWithProgress = await Promise.all(
    budgetsData.map(async (budget) => {
      const result = await db
        .select({
          spent: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, budget.categoryId),
            sql`${transactions.date} >= ${startOfMonth}`,
            sql`${transactions.date} <= ${endOfMonth}`
          )
        );

      const spent = result[0]?.spent || 0;
      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        progress: Math.min((spent / budget.amount) * 100, 100),
      };
    })
  );

  return budgetsWithProgress;
}

export async function updateBudget(id: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    period: formData.get("period"),
  };

  const validatedData = budgetSchema.parse(rawData);
  const amountInCents = Math.round(validatedData.amount * 100);

  await db
    .update(budgets)
    .set({
      categoryId: validatedData.categoryId,
      amount: amountInCents,
      period: validatedData.period,
    })
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));

  revalidatePath("/budgets");
}

export async function deleteBudget(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));

  revalidatePath("/budgets");
}
