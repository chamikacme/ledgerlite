"use server";

import { db } from "@/db";
import { accounts, userSettings } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
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

export async function updateUserSettings(currency: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await getUserSettings();

  if (existing) {
    await db
      .update(userSettings)
      .set({ currency, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({
      userId,
      currency,
    });
  }
  
  revalidatePath("/");
}
