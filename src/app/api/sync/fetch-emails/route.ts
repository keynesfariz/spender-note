import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';

import { budgetSettings, ignoredEmails, transactions } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { fetchRecentEmails } from '@/lib/gmail';
import { db } from '@/db';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const providerToken = session?.provider_token;
  const userId = user.id;

  if (!providerToken) {
    return NextResponse.json(
      { error: 'Google provider token not found. Please log in again.' },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const senderEmails: string[] = body.senderEmails || [];

  if (senderEmails.length === 0) {
    return NextResponse.json(
      { error: 'senderEmails is required in the request body.' },
      { status: 400 },
    );
  }

  // Fetch sync cursors from budgetSettings
  const [settings] = await db
    .select({
      syncCursors: budgetSettings.syncCursors,
      resetDayOfMonth: budgetSettings.resetDayOfMonth,
    })
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, userId))
    .limit(1);

  const syncCursors = (settings?.syncCursors || {}) as Record<string, number>;
  const resetDayOfMonth = settings?.resetDayOfMonth ?? 1;

  // Fetch emails
  const {
    emails: fetchedEmails,
    nextCursors,
    window,
  } = await fetchRecentEmails(
    providerToken,
    senderEmails,
    syncCursors,
    resetDayOfMonth,
  );

  if (fetchedEmails.length === 0) {
    return NextResponse.json({
      message: 'No new emails found matching the filter.',
      emails: [],
      nextCursors,
      window,
    });
  }

  // Filter out already processed emails to save AI parsing costs
  const emailIds = fetchedEmails.map((e) => e.id).filter(Boolean);
  const existingEmailIds = new Set<string>();

  if (emailIds.length > 0) {
    const existingTransactions = await db
      .select({ emailId: transactions.emailId })
      .from(transactions)
      .where(inArray(transactions.emailId, emailIds));

    for (const t of existingTransactions) {
      if (t.emailId) {
        existingEmailIds.add(t.emailId);
      }
    }

    const existingIgnored = await db
      .select({ emailId: ignoredEmails.emailId })
      .from(ignoredEmails)
      .where(inArray(ignoredEmails.emailId, emailIds));

    for (const i of existingIgnored) {
      if (i.emailId) {
        existingEmailIds.add(i.emailId);
      }
    }
  }

  const emails = fetchedEmails.filter((e) => !existingEmailIds.has(e.id));

  if (emails.length === 0) {
    return NextResponse.json({
      message: 'All fetched emails have already been synced.',
      emails: [],
      nextCursors,
      window,
    });
  }

  return NextResponse.json({
    message: `Fetched ${emails.length} emails.`,
    emails,
    nextCursors,
    window,
  });
}
