'use server';

import { inArray, and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { ignoreEmailRecord } from '@/lib/ignored-emails';
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

export async function createTransaction(data: {
  amount: string;
  type: string;
  date: Date;
  walletId: string;
  categoryId?: string | null;
  remark?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  try {
    await db.insert(transactions).values({
      userId: user.id,
      amount: data.amount,
      type: data.type,
      date: data.date,
      walletId: data.walletId,
      categoryId: data.categoryId || null,
      remark: data.remark || null,
    });
    revalidatePath('/transactions');
    return { success: true };
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return { error: 'Failed to create transaction.' };
  }
}

export async function updateTransaction(
  id: string,
  data: {
    amount: string;
    type: string;
    date: Date;
    walletId: string;
    categoryId?: string | null;
    remark?: string | null;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  try {
    await db
      .update(transactions)
      .set({
        amount: data.amount,
        type: data.type,
        date: data.date,
        walletId: data.walletId,
        categoryId: data.categoryId || null,
        remark: data.remark || null,
      })
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));

    revalidatePath('/transactions');
    return { success: true };
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return { error: 'Failed to update transaction.' };
  }
}

export async function deleteTransaction(
  id: string,
  emailId?: string | null,
  ignoreEmail?: boolean,
  transactionDate?: Date,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  try {
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));

    if (emailId && ignoreEmail && transactionDate) {
      await ignoreEmailRecord(
        user.id,
        emailId,
        'Deleted by user from transactions page',
        transactionDate,
      );
    }

    revalidatePath('/transactions');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return { error: 'Failed to delete transaction.' };
  }
}
