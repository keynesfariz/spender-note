import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { generateParserRules } from '@/lib/ai';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const emailBody: string = body.emailBody;

  if (!emailBody) {
    return NextResponse.json(
      { error: 'emailBody is required in the request body.' },
      { status: 400 },
    );
  }

  try {
    const regexRules = await generateParserRules(emailBody);
    return NextResponse.json({ rules: regexRules });
  } catch (error) {
    console.error('Error generating regex rules:', error);
    return NextResponse.json(
      { error: 'Failed to generate regex rules.' },
      { status: 500 },
    );
  }
}
