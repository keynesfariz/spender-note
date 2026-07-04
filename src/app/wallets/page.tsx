import { ArrowLeft, CreditCard, Wallet as WalletIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { AddWalletForm } from './add-wallet-form';
import { Button } from '@/components/ui/button';
import { wallets } from '@/db/schema';
import { db } from '@/db';

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

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Manage Wallets</h1>
        </div>
        <AddWalletForm />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userWallets.map((w) => (
          <Card key={w.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                {w.type === 'credit' ? (
                  <CreditCard className="mr-2 h-5 w-5 text-red-500" />
                ) : (
                  <WalletIcon className="mr-2 h-5 w-5 text-green-500" />
                )}
                {w.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(w.balance).toFixed(2)}
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
                        ? `$${parseFloat(w.creditLimit).toFixed(2)}`
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
    </div>
  );
}
