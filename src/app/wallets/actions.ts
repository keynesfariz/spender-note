'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { transactions, wallets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';

export async function addWallet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const label = formData.get('label') as string;
  const type = formData.get('type') as string;
  const balance = formData.get('balance') as string;
  const creditLimit = formData.get('creditLimit') as string;
  const statementDayOfMonth = formData.get('statementDayOfMonth') as string;

  if (!label || !type || !balance) {
    throw new Error('Missing required fields');
  }

  await db.insert(wallets).values({
    userId: user.id,
    label,
    type,
    balance,
    creditLimit: type === 'credit' && creditLimit ? creditLimit : null,
    statementDayOfMonth:
      type === 'credit' && statementDayOfMonth
        ? parseInt(statementDayOfMonth, 10)
        : null,
  });

  revalidatePath('/wallets');
  revalidatePath('/');
}

export async function mergeWallets(sourceWalletId: string, targetWalletId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (sourceWalletId === targetWalletId) {
    throw new Error('Cannot merge a wallet into itself');
  }

  await db.transaction(async (tx) => {
    // 1. Get both wallets
    const sourceWallets = await tx.select().from(wallets).where(and(eq(wallets.id, sourceWalletId), eq(wallets.userId, user.id)));
    const targetWallets = await tx.select().from(wallets).where(and(eq(wallets.id, targetWalletId), eq(wallets.userId, user.id)));

    if (sourceWallets.length === 0 || targetWallets.length === 0) {
      throw new Error('Wallet not found');
    }

    const sourceWallet = sourceWallets[0];
    const targetWallet = targetWallets[0];

    // 2. Move all transactions to target wallet
    await tx
      .update(transactions)
      .set({ walletId: targetWalletId })
      .where(and(eq(transactions.walletId, sourceWalletId), eq(transactions.userId, user.id)));

    // 3. Recalculate balance for target wallet based on all its transactions (including newly moved ones)
    const allTx = await tx
      .select()
      .from(transactions)
      .where(and(eq(transactions.walletId, targetWalletId), eq(transactions.userId, user.id)));

    let newBalance = 0;
    for (const t of allTx) {
      const amount = Number(t.amount);
      if (targetWallet.type === 'credit') {
        newBalance += (t.type === 'expense' ? amount : -amount);
      } else {
        newBalance += (t.type === 'expense' ? -amount : amount);
      }
    }

    // 4. Update target wallet (balance + combined sourceIds)
    const combinedSourceIds = Array.from(new Set([...targetWallet.sourceIds, ...sourceWallet.sourceIds]));
    await tx
      .update(wallets)
      .set({
        balance: newBalance.toString(),
        sourceIds: combinedSourceIds,
      })
      .where(eq(wallets.id, targetWalletId));

    // 5. Delete source wallet
    await tx.delete(wallets).where(eq(wallets.id, sourceWalletId));
  });

  revalidatePath('/wallets');
  revalidatePath('/');
}
