import { NextResponse } from 'next/server';

import { fixParserRule } from '@/lib/ai/parser-generator';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { emailBody, field, expectedValue } = body;

  if (!emailBody || !field || !expectedValue) {
    return NextResponse.json(
      { error: 'emailBody, field, and expectedValue are required.' },
      { status: 400 },
    );
  }

  try {
    const regex = await fixParserRule(emailBody, field, expectedValue);
    return NextResponse.json({ regex });
  } catch (error) {
    console.error('Error fixing regex rule:', error);
    return NextResponse.json(
      { error: 'Failed to fix regex rule.' },
      { status: 500 },
    );
  }
}
