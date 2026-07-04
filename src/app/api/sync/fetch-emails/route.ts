import { db } from '@/db';
import { transactions } from '@/db/schema';
import { fetchRecentEmails } from '@/lib/gmail';
import { createClient } from '@/lib/supabase/server';
import { desc, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  const providerToken = session?.provider_token;
  const userId = user.id;

  if (!providerToken) {
    return NextResponse.json({ error: 'Google provider token not found. Please log in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const senderEmails: string[] = body.senderEmails || [];

  if (senderEmails.length === 0) {
    return NextResponse.json({ error: 'senderEmails is required in the request body.' }, { status: 400 });
  }

  // Fetch the latest transaction to determine the afterDate
  const [latestTransaction] = await db
    .select({ date: transactions.date })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(1);

  let afterDate: Date | undefined = undefined;
  if (latestTransaction && latestTransaction.date) {
    afterDate = new Date(latestTransaction.date);
    // Subtract 1 day to be safe with timezone boundaries
    afterDate.setDate(afterDate.getDate() - 1);
  }

  // Fetch emails
  const fetchedEmails = await fetchRecentEmails(providerToken, senderEmails, afterDate);

  if (fetchedEmails.length === 0) {
    return NextResponse.json({ message: 'No new emails found matching the filter.', emails: [] });
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
  }

  const emails = fetchedEmails.filter((e) => !existingEmailIds.has(e.id));

  if (emails.length === 0) {
    return NextResponse.json({ message: 'All fetched emails have already been synced.', emails: [] });
  }

  return NextResponse.json({ message: `Fetched ${emails.length} emails.`, emails });
}
