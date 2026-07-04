'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { createClient } from '@/lib/supabase/server';
import { budgetSettings } from '@/db/schema';
import { db } from '@/db';

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const monthlyAmount = formData.get('monthlyAmount') as string;
  const resetDayOfMonth = formData.get('resetDayOfMonth') as string;
  const activeParsers = formData.getAll('activeParsers') as string[];

  if (!monthlyAmount || !resetDayOfMonth) {
    throw new Error('Missing required fields');
  }

  const existing = await db
    .select()
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, user.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(budgetSettings)
      .set({
        monthlyAmount,
        resetDayOfMonth: parseInt(resetDayOfMonth, 10),
        activeParsers,
      })
      .where(eq(budgetSettings.id, existing[0].id));
  } else {
    await db.insert(budgetSettings).values({
      userId: user.id,
      monthlyAmount,
      resetDayOfMonth: parseInt(resetDayOfMonth, 10),
      activeParsers,
    });
  }

  revalidatePath('/settings');
  revalidatePath('/');
}
