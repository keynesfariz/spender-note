'use server'

import { db } from '@/db'
import { budgetSettings } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function saveSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const monthlyAmount = formData.get('monthlyAmount') as string
  const resetDayOfMonth = formData.get('resetDayOfMonth') as string
  const senderEmailFilter = formData.get('senderEmailFilter') as string

  if (!monthlyAmount || !resetDayOfMonth || !senderEmailFilter) {
    throw new Error('Missing required fields')
  }

  const existing = await db.select().from(budgetSettings).where(eq(budgetSettings.userId, user.id)).limit(1)

  if (existing.length > 0) {
    await db.update(budgetSettings).set({
      monthlyAmount,
      resetDayOfMonth: parseInt(resetDayOfMonth, 10),
      senderEmailFilter,
    }).where(eq(budgetSettings.id, existing[0].id))
  } else {
    await db.insert(budgetSettings).values({
      userId: user.id,
      monthlyAmount,
      resetDayOfMonth: parseInt(resetDayOfMonth, 10),
      senderEmailFilter,
    })
  }

  revalidatePath('/settings')
  revalidatePath('/')
}
