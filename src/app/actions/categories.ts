"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
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

  return await db.select().from(categories).where(eq(categories.userId, userId));
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

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  revalidatePath("/transactions");
}
