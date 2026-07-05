import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { emailParsers } from '@/db/schema';
import { db } from '@/db';

const saveParserSchema = z.object({
  name: z.string().min(1),
  senderEmail: z.email(),
  regexRules: z.record(z.string(), z.string().nullable()),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const validatedData = saveParserSchema.parse(body);

    await db.insert(emailParsers).values({
      userId: user.id,
      name: validatedData.name,
      senderEmail: validatedData.senderEmail,
      regexRules: validatedData.regexRules,
      enabled: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving parser:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format.', details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to save parser.' },
      { status: 500 },
    );
  }
}
