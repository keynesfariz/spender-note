import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';

import { categories, wallets, budgetSettings } from '@/db/schema';
import { db } from '@/db';

export const getCachedCategories = async (userId: string) => {
  return unstable_cache(
    async () => {
      return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.userId, userId));
    },
    ['categories', userId],
    { tags: [`categories-${userId}`] },
  )();
};

export const getCachedWallets = async (userId: string) => {
  return unstable_cache(
    async () => {
      return db
        .select({ id: wallets.id, label: wallets.label })
        .from(wallets)
        .where(eq(wallets.userId, userId));
    },
    ['wallets', userId],
    { tags: [`wallets-${userId}`] },
  )();
};

export const getCachedBudgetSettings = async (userId: string) => {
  return unstable_cache(
    async () => {
      return db
        .select()
        .from(budgetSettings)
        .where(eq(budgetSettings.userId, userId))
        .limit(1);
    },
    ['budgetSettings', userId],
    { tags: [`budget-settings-${userId}`] },
  )();
};
