"use server";

import { db } from "@/db";
import { goals, accounts, transactions, transactionEntries } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  currentAmount: z.coerce.number().min(0).default(0),
});

export async function createGoal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount"),
  };

  const validatedData = goalSchema.parse(rawData);
  const targetAmountInCents = Math.round(validatedData.targetAmount * 100);
  const currentAmountInCents = Math.round(validatedData.currentAmount * 100);

  // Create a dedicated savings account for this goal
  const [savingsAccount] = await db.insert(accounts).values({
    userId,
    name: `💰 ${validatedData.name}`,
    type: 'asset',
    balance: currentAmountInCents,
    currency: 'LKR', // TODO: Get from user settings
  }).returning();

  // Create the goal linked to the account
  await db.insert(goals).values({
    userId,
    name: validatedData.name,
    targetAmount: targetAmountInCents,
    currentAmount: currentAmountInCents,
    accountId: savingsAccount.id,
  });

  revalidatePath("/goals");
  revalidatePath("/accounts");
}

export async function getGoals() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.select().from(goals).where(eq(goals.userId, userId));
}

export async function updateGoal(id: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rawData = {
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
  };

  const updateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    targetAmount: z.coerce.number().positive("Target amount must be positive"),
  });

  const validatedData = updateSchema.parse(rawData);
  const targetAmountInCents = Math.round(validatedData.targetAmount * 100);

  await db
    .update(goals)
    .set({
      name: validatedData.name,
      targetAmount: targetAmountInCents,
    })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));

  revalidatePath("/goals");
}

export async function contributeToGoal(goalId: number, fromAccountId: number, amount: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // amount is in dollars, convert to cents
    const amountInCents = Math.round(amount * 100);

    // Get the goal and its linked account
    const goal = await db.query.goals.findFirst({
        where: and(eq(goals.id, goalId), eq(goals.userId, userId))
    });

    if (!goal) throw new Error("Goal not found");
    if (!goal.accountId) throw new Error("Goal has no linked account");

    const goalAccountId = goal.accountId; // Type narrowing

    // Create a transfer transaction from source account to goal account
    await db.transaction(async (tx) => {
        // Create transaction record
        const [txRecord] = await tx.insert(transactions).values({
            userId,
            date: new Date(),
            description: `Contribution to ${goal.name}`,
            amount: amountInCents,
        }).returning();

        // Create entries (Credit source, Debit goal account)
        await tx.insert(transactionEntries).values([
            { transactionId: txRecord.id, accountId: fromAccountId, type: 'credit', amount: amountInCents },
            { transactionId: txRecord.id, accountId: goalAccountId, type: 'debit', amount: amountInCents },
        ]);

        // Update balances
        await tx.update(accounts)
            .set({ balance: sql`${accounts.balance} - ${amountInCents}` })
            .where(eq(accounts.id, fromAccountId));

        await tx.update(accounts)
            .set({ balance: sql`${accounts.balance} + ${amountInCents}` })
            .where(eq(accounts.id, goalAccountId));

        // Update goal current amount
        await tx.update(goals)
            .set({ currentAmount: sql`${goals.currentAmount} + ${amountInCents}` })
            .where(eq(goals.id, goalId));
    });

    revalidatePath("/goals");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
}

export async function withdrawAndCompleteGoal(goalId: number, toAccountId: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get the goal and its linked account
    const goal = await db.query.goals.findFirst({
        where: and(eq(goals.id, goalId), eq(goals.userId, userId))
    });

    if (!goal) throw new Error("Goal not found");
    if (!goal.accountId) throw new Error("Goal has no linked account");

    const goalAccountId = goal.accountId;
    const amount = goal.currentAmount;

    // Transfer all money from goal account to destination account and mark complete
    await db.transaction(async (tx) => {
        // Create transaction record
        const [txRecord] = await tx.insert(transactions).values({
            userId,
            date: new Date(),
            description: `Withdrawal from ${goal.name} (Goal Completed)`,
            amount: amount,
        }).returning();

        // Create entries (Credit goal account, Debit destination)
        await tx.insert(transactionEntries).values([
            { transactionId: txRecord.id, accountId: goalAccountId, type: 'credit', amount: amount },
            { transactionId: txRecord.id, accountId: toAccountId, type: 'debit', amount: amount },
        ]);

        // Update balances
        await tx.update(accounts)
            .set({ balance: 0 }) // Goal account to zero
            .where(eq(accounts.id, goalAccountId));

        await tx.update(accounts)
            .set({ balance: sql`${accounts.balance} + ${amount}` })
            .where(eq(accounts.id, toAccountId));

        // Mark goal as completed and reset current amount
        await tx.update(goals)
            .set({ 
                completed: true,
                currentAmount: 0
            })
            .where(eq(goals.id, goalId));
    });

    revalidatePath("/goals");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
}

export async function deleteGoal(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));

  revalidatePath("/goals");
}
