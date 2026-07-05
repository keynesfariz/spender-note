'use server';

import { revalidatePath } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { eq, sql, and } from 'drizzle-orm';

import { categories, transactions, budgetSettings } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { calculatePeriodDates } from '@/lib/budget';
import { db } from '@/db';

export async function getCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const getCachedSettings = unstable_cache(
    async (userId: string) => {
      const existing = await db
        .select()
        .from(budgetSettings)
        .where(eq(budgetSettings.userId, userId))
        .limit(1);
      return existing[0] || null;
    },
    [`budget-settings-${user.id}`],
    { tags: [`budget-settings-${user.id}`] },
  );

  const settings = await getCachedSettings(user.id);
  const resetDay = settings?.resetDayOfMonth || 1;
  const currency = settings?.currency || 'USD';
  const { start, end } = calculatePeriodDates(new Date(), resetDay);

  const categoryStats = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      allTimeTxCount: sql<number>`count(${transactions.id})::int`,
      allTimeAmount: sql<number>`COALESCE(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else -${transactions.amount} end), 0)::float`,
      thisMonthTxCount: sql<number>`count(case when ${transactions.date} >= ${start.toISOString()} and ${transactions.date} <= ${end.toISOString()} then 1 end)::int`,
      thisMonthAmount: sql<number>`COALESCE(sum(case when ${transactions.date} >= ${start.toISOString()} and ${transactions.date} <= ${end.toISOString()} then (case when ${transactions.type} = 'income' then ${transactions.amount} else -${transactions.amount} end) else 0 end), 0)::float`,
    })
    .from(categories)
    .leftJoin(transactions, eq(categories.id, transactions.categoryId))
    .where(eq(categories.userId, user.id))
    .groupBy(categories.id);

  return categoryStats.map((c) => ({
    ...c,
    currency,
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
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)));

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

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)));

  revalidatePath('/categories');
}
