import { and, eq } from 'drizzle-orm';

import { ignoredEmails } from '@/db/schema';
import { db } from '@/db';

export async function ignoreEmailRecord(
  userId: string,
  emailId: string,
  reason: string,
  emailDate: Date,
) {
  // Check if it's already ignored to prevent duplicate key errors
  const existing = await db
    .select()
    .from(ignoredEmails)
    .where(
      and(eq(ignoredEmails.userId, userId), eq(ignoredEmails.emailId, emailId)),
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(ignoredEmails).values({
      userId,
      emailId,
      reason,
      emailDate,
    });
  }
}
