/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { syncEmailTransactions } from '@/lib/sync-service';
import { createClient } from '@/lib/supabase/server';
import { wallets } from '@/db/schema';
import { db } from '@/db';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    const email = await req.json();

    if (!email || !email.body) {
      return NextResponse.json(
        { error: 'Email body is required' },
        { status: 400 },
      );
    }

    // Fetch user wallets to map accounts
    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    const savedCount = await syncEmailTransactions(
      db,
      userId,
      [email],
      userWallets,
    );

    if (savedCount === 0) {
      return NextResponse.json(
        { error: 'No transactions were found or saved from this email.' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: `Synced ${savedCount} transactions successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 },
    );
  }
}
