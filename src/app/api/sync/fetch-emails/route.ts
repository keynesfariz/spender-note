import { desc, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { transactions, ignoredEmails } from '@/db/schema';
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

  // Fetch the latest transaction to determine the afterDate
  const [latestTransaction] = await db
    .select({ date: transactions.date })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(1);

  const [latestIgnored] = await db
    .select({ date: ignoredEmails.emailDate })
    .from(ignoredEmails)
    .where(eq(ignoredEmails.userId, userId))
    .orderBy(desc(ignoredEmails.emailDate))
    .limit(1);

  let afterDate: Date | undefined = undefined;
  let maxDate: Date | undefined = undefined;

  if (latestTransaction && latestTransaction.date) {
    maxDate = new Date(latestTransaction.date);
  }

  if (latestIgnored && latestIgnored.date) {
    const ignoredDate = new Date(latestIgnored.date);
    if (!maxDate || ignoredDate > maxDate) {
      maxDate = ignoredDate;
    }
  }

  if (maxDate) {
    afterDate = maxDate;
    // Subtract 1 day to be safe with timezone boundaries
    afterDate.setDate(afterDate.getDate() - 1);
  }

  // Fetch emails
  const fetchedEmails = await fetchRecentEmails(
    providerToken,
    senderEmails,
    afterDate,
  );

  if (fetchedEmails.length === 0) {
    return NextResponse.json({
      message: 'No new emails found matching the filter.',
      emails: [],
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
    });
  }

  return NextResponse.json({
    message: `Fetched ${emails.length} emails.`,
    emails,
  });
}
