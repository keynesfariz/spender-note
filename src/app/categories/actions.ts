'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { categories, transactions } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';

export async function getCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id));

  const userTransactions = await db
    .select({ categoryId: transactions.categoryId })
    .from(transactions)
    .where(eq(transactions.userId, user.id));

  const counts: Record<string, number> = {};
  userTransactions.forEach((tx) => {
    if (tx.categoryId) {
      counts[tx.categoryId] = (counts[tx.categoryId] || 0) + 1;
    }
  });

  return allCategories.map((c) => ({
    ...c,
    transactionCount: counts[c.id] || 0,
  }));
}

export async function createCategory(data: {
  name: string;
  icon: string;
  color: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await db.insert(categories).values({
    userId: user.id,
    name: data.name,
    icon: data.icon,
    color: data.color,
  });

  revalidatePath('/categories');
}

export async function updateCategory(
  id: string,
  data: { name: string; icon: string; color: string },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await db
    .update(categories)
    .set({
      name: data.name,
      icon: data.icon,
      color: data.color,
    })
    .where(eq(categories.id, id));

  revalidatePath('/categories');
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath('/categories');
}
