import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { createClient } from '@/lib/supabase/server';
import { budgetSettings } from '@/db/schema';
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
  const body = await req.json().catch(() => ({}));
  const nextCursors: Record<string, number> = body.nextCursors;

  if (!nextCursors || typeof nextCursors !== 'object') {
    return NextResponse.json(
      { error: 'nextCursors is required in the request body.' },
      { status: 400 },
    );
  }

  try {
    // Fetch current settings to merge cursors securely
    const [settings] = await db
      .select({ syncCursors: budgetSettings.syncCursors })
      .from(budgetSettings)
      .where(eq(budgetSettings.userId, userId))
      .limit(1);

    if (!settings) {
      return NextResponse.json(
        { error: 'Budget settings not found.' },
        { status: 404 },
      );
    }

    const currentCursors = (settings.syncCursors || {}) as Record<
      string,
      number
    >;
    const updatedCursors = { ...currentCursors, ...nextCursors };

    await db
      .update(budgetSettings)
      .set({ syncCursors: updatedCursors })
      .where(eq(budgetSettings.userId, userId));

    return NextResponse.json({
      message: 'Sync cursors updated successfully.',
      syncCursors: updatedCursors,
    });
  } catch (error) {
    console.error('Error updating sync cursors:', error);
    return NextResponse.json(
      { error: 'Failed to update sync cursors.' },
      { status: 500 },
    );
  }
}
