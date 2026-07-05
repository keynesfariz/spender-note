'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

import { createClient } from '@/lib/supabase/server';
import { transactions, wallets } from '@/db/schema';
import { db } from '@/db';

export async function createWallet(data: {
  label: string;
  type: string;
  balance: string;
  creditLimit?: string | null;
  statementDayOfMonth?: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!data.label || !data.type || !data.balance) {
    throw new Error('Missing required fields');
  }

  await db.insert(wallets).values({
    userId: user.id,
    label: data.label,
    type: data.type,
    balance: data.balance,
    creditLimit:
      data.type === 'credit' && data.creditLimit ? data.creditLimit : null,
    statementDayOfMonth:
      data.type === 'credit' && data.statementDayOfMonth
        ? data.statementDayOfMonth
        : null,
  });

  revalidatePath('/wallets');
  revalidatePath('/');
}

export async function updateWallet(
  id: string,
  data: {
    label: string;
    type: string;
    balance: string;
    creditLimit?: string | null;
    statementDayOfMonth?: number | null;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!data.label || !data.type || !data.balance) {
    throw new Error('Missing required fields');
  }

  await db
    .update(wallets)
    .set({
      label: data.label,
      type: data.type,
      balance: data.balance,
      creditLimit:
        data.type === 'credit' && data.creditLimit ? data.creditLimit : null,
      statementDayOfMonth:
        data.type === 'credit' && data.statementDayOfMonth
          ? data.statementDayOfMonth
          : null,
    })
    .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)));

  revalidatePath('/wallets');
  revalidatePath('/');
}

export async function deleteWallet(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await db.transaction(async (tx) => {
    // Delete all transactions associated with this wallet first
    await tx
      .delete(transactions)
      .where(
        and(eq(transactions.walletId, id), eq(transactions.userId, user.id)),
      );

    // Delete the wallet
    await tx
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)));
  });

  revalidatePath('/wallets');
  revalidatePath('/');
}

export async function mergeWallets(
  sourceWalletId: string,
  targetWalletId: string,
) {
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
    const sourceWallets = await tx
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, sourceWalletId), eq(wallets.userId, user.id)));
    const targetWallets = await tx
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, targetWalletId), eq(wallets.userId, user.id)));

    if (sourceWallets.length === 0 || targetWallets.length === 0) {
      throw new Error('Wallet not found');
    }

    const sourceWallet = sourceWallets[0];
    const targetWallet = targetWallets[0];

    // 2. Move all transactions to target wallet
    await tx
      .update(transactions)
      .set({ walletId: targetWalletId })
      .where(
        and(
          eq(transactions.walletId, sourceWalletId),
          eq(transactions.userId, user.id),
        ),
      );

    // 3. Calculate target wallet's new balance (reconcile different types if necessary, preserving starting/manual balances)
    let newBalanceNum = Number(targetWallet.balance);
    if (targetWallet.type === sourceWallet.type) {
      newBalanceNum += Number(sourceWallet.balance);
    } else {
      newBalanceNum -= Number(sourceWallet.balance);
    }
    const newBalance = newBalanceNum.toFixed(2);

    // 4. Update target wallet (balance + combined sourceIds)
    const combinedSourceIds = Array.from(
      new Set([...targetWallet.sourceIds, ...sourceWallet.sourceIds]),
    );
    await tx
      .update(wallets)
      .set({
        balance: newBalance,
        sourceIds: combinedSourceIds,
      })
      .where(and(eq(wallets.id, targetWalletId), eq(wallets.userId, user.id)));

    // 5. Delete source wallet
    await tx
      .delete(wallets)
      .where(and(eq(wallets.id, sourceWalletId), eq(wallets.userId, user.id)));
  });

  revalidatePath('/wallets');
  revalidatePath('/');
}
