import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import type { Metadata } from 'next';

import { WalletsClient } from './components/wallets-client';
import { budgetSettings, wallets } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';

export const metadata: Metadata = {
  title: 'Wallets',
  description: 'A curated overview of your liquidity and credit obligations.',
};

export default async function WalletsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [userWallets, [setting]] = await Promise.all([
    db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id)),
    db
      .select()
      .from(budgetSettings)
      .where(eq(budgetSettings.userId, user.id))
      .limit(1),
  ]);

  const currency = setting?.currency || 'USD';

  return (
    <WalletsClient
      initialWallets={userWallets}
      currency={currency}
      metadata={metadata}
    />
  );
}
