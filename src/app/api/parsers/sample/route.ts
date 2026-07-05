import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { fetchSampleEmails } from '@/lib/gmail';

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

  if (!providerToken) {
    return NextResponse.json(
      { error: 'Google provider token not found. Please log in again.' },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const senderEmail: string = body.senderEmail;

  if (!senderEmail) {
    return NextResponse.json(
      { error: 'senderEmail is required in the request body.' },
      { status: 400 },
    );
  }

  try {
    const emails = await fetchSampleEmails(providerToken, senderEmail, 3);

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { error: 'No emails found from this sender.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error in sample endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample emails.' },
      { status: 500 },
    );
  }
}
