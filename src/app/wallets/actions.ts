'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { wallets } from '@/db/schema';
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
