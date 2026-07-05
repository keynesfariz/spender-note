'use server';

import { inArray, and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { transactions } from '@/db/schema';
import { db } from '@/db';

export async function bulkUpdateTransactions(
  transactionIds: string[],
  data: { categoryId?: string; walletId?: string },
) {
  if (!transactionIds.length) {
    return { error: 'No transactions selected.' };
  }

  if (!data.categoryId && !data.walletId) {
    return { error: 'No update data provided.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    const updateData: Partial<typeof transactions.$inferInsert> = {};
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.walletId) updateData.walletId = data.walletId;

    await db
      .update(transactions)
      .set(updateData)
      .where(
        and(
          eq(transactions.userId, user.id),
          inArray(transactions.id, transactionIds),
        ),
      );

    revalidatePath('/transactions');
    return { success: true };
  } catch (error) {
    console.error('Failed to bulk update transactions:', error);
    return { error: 'Failed to update transactions. Please try again.' };
  }
}
