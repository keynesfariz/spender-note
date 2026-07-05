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
  const currency = formData.get('currency') as string;
  const rawAiEmails = formData.get('aiCustomEmails') as string | null;
  const aiCustomEmails = rawAiEmails
    ? rawAiEmails
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!monthlyAmount || !resetDayOfMonth || !currency) {
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
        aiCustomEmails,
        currency,
      })
      .where(eq(budgetSettings.id, existing[0].id));
  } else {
    await db.insert(budgetSettings).values({
      userId: user.id,
      monthlyAmount,
      resetDayOfMonth: parseInt(resetDayOfMonth, 10),
      activeParsers,
      aiCustomEmails,
      currency,
    });
  }

  revalidatePath('/settings');
  revalidatePath('/');
}
