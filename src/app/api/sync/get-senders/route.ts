import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { getParserById } from '@/lib/parsers/registry';
import { createClient } from '@/lib/supabase/server';
import { budgetSettings } from '@/db/schema';
import { db } from '@/db';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // Get budget settings for sender filter
  const [settings] = await db
    .select()
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, userId))
    .limit(1);

  const activeParsersIds = settings?.activeParsers || [];

  if (activeParsersIds.length === 0) {
    return NextResponse.json(
      { error: 'No active email parsers configured in budget settings.' },
      { status: 400 },
    );
  }

  const senderEmails: string[] = [];
  for (const parserId of activeParsersIds) {
    const parser = await getParserById(parserId);
    if (parser) {
      senderEmails.push(...parser.senderEmails);
    }
  }

  if (senderEmails.length === 0) {
    return NextResponse.json(
      { error: 'Active parsers have no sender emails configured.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ senderEmails });
}
