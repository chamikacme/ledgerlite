"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { shortcuts, transactions, transactionEntries, accounts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const shortcutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  fromAccountId: z.coerce.number(),
  toAccountId: z.coerce.number(),
  categoryId: z.coerce.number().optional(),
});

export async function getShortcuts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db.query.shortcuts.findMany({
    where: eq(shortcuts.userId, userId),
    with: {
      fromAccount: true,
      toAccount: true,
      category: true,
    },
    orderBy: [desc(shortcuts.createdAt)],
  });

  return result;
}

export async function createShortcut(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const icon = formData.get("icon");
  const description = formData.get("description");
  const categoryId = formData.get("categoryId");

  const data = {
    name: formData.get("name"),
    description: description && description !== "" ? description : null,
    icon: icon && icon !== "" ? icon : "⚡",
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    categoryId: categoryId && categoryId !== "" ? categoryId : null,
  };

  const validatedData = shortcutSchema.parse(data);

  await db.insert(shortcuts).values({
    userId,
    name: validatedData.name,
    description: validatedData.description || null,
    icon: validatedData.icon || "⚡",
    fromAccountId: validatedData.fromAccountId,
    toAccountId: validatedData.toAccountId,
    categoryId: validatedData.categoryId || null,
  });

  revalidatePath("/shortcuts");
  revalidatePath("/transactions");
}

export async function updateShortcut(id: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const icon = formData.get("icon");
  const description = formData.get("description");
  const categoryId = formData.get("categoryId");

  const data = {
    name: formData.get("name"),
    description: description && description !== "" ? description : null,
    icon: icon && icon !== "" ? icon : "⚡",
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    categoryId: categoryId && categoryId !== "" ? categoryId : null,
  };

  const validatedData = shortcutSchema.parse(data);

  await db
    .update(shortcuts)
    .set({
      name: validatedData.name,
      description: validatedData.description || null,
      icon: validatedData.icon || "⚡",
      fromAccountId: validatedData.fromAccountId,
      toAccountId: validatedData.toAccountId,
      categoryId: validatedData.categoryId || null,
    })
    .where(and(eq(shortcuts.id, id), eq(shortcuts.userId, userId)));

  revalidatePath("/shortcuts");
  revalidatePath("/transactions");
}

export async function deleteShortcut(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(shortcuts)
    .where(and(eq(shortcuts.id, id), eq(shortcuts.userId, userId)));

  revalidatePath("/shortcuts");
  revalidatePath("/transactions");
}

export async function executeShortcut(shortcutId: number, amount: number, description?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get the shortcut
  const shortcut = await db.query.shortcuts.findFirst({
    where: and(eq(shortcuts.id, shortcutId), eq(shortcuts.userId, userId)),
  });

  if (!shortcut) throw new Error("Shortcut not found");

  const amountInCents = Math.round(amount * 100);

  // Create transaction
  const [transaction] = await db
    .insert(transactions)
    .values({
      userId,
      description: description || shortcut.name,
      date: new Date(),
      amount: amountInCents,
      categoryId: shortcut.categoryId,
    })
    .returning();

  // Create transaction entries (double-entry bookkeeping)
  await db.insert(transactionEntries).values([
    {
      transactionId: transaction.id,
      accountId: shortcut.fromAccountId,
      type: "credit",
      amount: amountInCents,
    },
    {
      transactionId: transaction.id,
      accountId: shortcut.toAccountId,
      type: "debit",
      amount: amountInCents,
    },
  ]);

  // Update account balances based on account types
  const [fromAccount, toAccount] = await Promise.all([
    db.query.accounts.findFirst({ where: eq(accounts.id, shortcut.fromAccountId) }),
    db.query.accounts.findFirst({ where: eq(accounts.id, shortcut.toAccountId) }),
  ]);

  if (fromAccount) {
    // Credit entry - different effect based on account type
    // Asset/Expense: Credit decreases balance
    // Liability/Revenue: Credit increases balance
    if (fromAccount.type === "asset" || fromAccount.type === "expense") {
      await db
        .update(accounts)
        .set({ balance: fromAccount.balance - amountInCents })
        .where(eq(accounts.id, shortcut.fromAccountId));
    } else if (fromAccount.type === "liability" || fromAccount.type === "revenue") {
      await db
        .update(accounts)
        .set({ balance: fromAccount.balance + amountInCents })
        .where(eq(accounts.id, shortcut.fromAccountId));
    }
  }

  if (toAccount) {
    // Debit entry - different effect based on account type
    // Asset/Expense: Debit increases balance
    // Liability/Revenue: Debit decreases balance
    if (toAccount.type === "asset" || toAccount.type === "expense") {
      await db
        .update(accounts)
        .set({ balance: toAccount.balance + amountInCents })
        .where(eq(accounts.id, shortcut.toAccountId));
    } else if (toAccount.type === "liability" || toAccount.type === "revenue") {
      await db
        .update(accounts)
        .set({ balance: toAccount.balance - amountInCents })
        .where(eq(accounts.id, shortcut.toAccountId));
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

