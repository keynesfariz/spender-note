import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { budgetSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fetchRecentEmails } from '@/lib/gmail';

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

  // Get budget settings for sender filter
  const [settings] = await db
    .select()
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, userId))
    .limit(1);
  const senderFilter = settings?.senderEmailFilter;

  if (!senderFilter) {
    return NextResponse.json({ error: 'Sender email filter not configured in budget settings.' }, { status: 400 });
  }

  // Fetch emails
  const emails = await fetchRecentEmails(providerToken, senderFilter);
  
  if (emails.length === 0) {
    return NextResponse.json({ message: 'No new emails found matching the filter.', emails: [] });
  }

  return NextResponse.json({ message: `Fetched ${emails.length} emails.`, emails });
}
