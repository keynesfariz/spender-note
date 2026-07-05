import { CreditCard, Wallet as WalletIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletCardActions } from './wallet-card-actions';
import { budgetSettings, wallets } from '@/db/schema';
import { PageLayout } from '@/components/PageLayout';
import { createClient } from '@/lib/supabase/server';
import { AddWalletForm } from './add-wallet-form';
import { formatCurrency } from '@/lib/format';
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

  const userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, user.id));

  const [setting] = await db
    .select()
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, user.id))
    .limit(1);

  const currency = setting?.currency || 'USD';

  return (
    <PageLayout metadata={metadata} actions={<AddWalletForm />}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userWallets.map((w) => (
          <Card key={w.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center text-lg">
                {w.type === 'credit' ? (
                  <CreditCard className="mr-2 h-5 w-5 text-red-500" />
                ) : (
                  <WalletIcon className="mr-2 h-5 w-5 text-green-500" />
                )}
                {w.label}
              </CardTitle>
              <WalletCardActions wallet={w} allWallets={userWallets} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(parseFloat(w.balance), currency)}
              </div>
              <p className="text-muted-foreground mt-1 text-xs tracking-wider uppercase">
                {w.type === 'credit' ? 'Debt Balance' : 'Available Balance'}
              </p>
              {w.type === 'credit' && (
                <div className="mt-4 space-y-1 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span>
                      {w.creditLimit
                        ? formatCurrency(parseFloat(w.creditLimit), currency)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Statement Day:
                    </span>
                    <span>{w.statementDayOfMonth || 'N/A'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {userWallets.length === 0 && (
          <div className="text-muted-foreground col-span-full rounded-lg border border-dashed p-8 text-center">
            You haven&apos;t added any wallets yet. Click the button above to
            add one.
          </div>
        )}
      </div>
    </PageLayout>
  );
}
