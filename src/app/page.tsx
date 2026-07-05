import { CreditCard, Wallet as WalletIcon } from 'lucide-react';
import { and, desc, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { Temporal } from '@js-temporal/polyfill';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import type { Metadata } from 'next';

import {
  calculateNetWorth,
  calculatePeriodDates,
  calculateRemainingBudget,
} from '@/lib/budget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetSettings, categories, transactions, wallets } from '@/db/schema';
import { ExpensesChart } from '@/components/ExpensesChart';
import { SyncButton } from '@/components/SyncButton';
import { PageLayout } from '@/components/PageLayout';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { db } from '@/db';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Performance overview for the current billing cycle.',
};

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;

  const [setting] = await db
    .select()
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, userId))
    .limit(1);
  const userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));
  const userTransactions = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      emailId: transactions.emailId,
      walletId: transactions.walletId,
      amount: transactions.amount,
      type: transactions.type,
      categoryId: transactions.categoryId,
      date: transactions.date,
      remark: transactions.remark,
      createdAt: transactions.createdAt,
      category: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(50);

  let remainingDailyBudget = 0;
  let remainingBudget = 0;
  let daysRemaining = 0;

  if (setting) {
    const today = Temporal.Now.plainDateISO();
    const resetDay = setting.resetDayOfMonth || 1;

    const period = calculatePeriodDates(today, resetDay);
    daysRemaining = period.daysRemaining;

    const startJsDate = new Date(period.start.toString());
    const endJsDate = new Date(period.end.toString());

    // Calculate total expenses in this period
    const expenses = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startJsDate),
          lte(transactions.date, endJsDate),
        ),
      );

    const totalExpenses = parseFloat(expenses[0]?.total || '0');
    const monthlyAmount = parseFloat(setting.monthlyAmount);

    const budget = calculateRemainingBudget(
      monthlyAmount,
      totalExpenses,
      daysRemaining,
    );
    remainingBudget = budget.remainingBudget;
    remainingDailyBudget = budget.remainingDailyBudget;
  }

  // Calculate Net Worth
  const netWorthDetails = calculateNetWorth(userWallets);
  const currency = setting?.currency || 'USD';

  return (
    <PageLayout
      metadata={metadata}
      actions={
        <div className="flex space-x-2">
          <Link href="/settings">
            <Button variant="outline">Settings</Button>
          </Link>
          <SyncButton />
        </div>
      }>
      {!setting && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            Please configure your budget settings and email filter in the{' '}
            <Link href="/settings" className="font-bold underline">
              Settings
            </Link>{' '}
            page.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center text-sm font-medium">
              Remaining Daily Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(remainingDailyBudget, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatCurrency(remainingBudget, currency)} total remaining for{' '}
              {daysRemaining} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center text-sm font-medium">
              <WalletIcon className="mr-2 h-4 w-4" /> Total Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(netWorthDetails.netWorth, currency)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Debit: {formatCurrency(netWorthDetails.totalDebit, currency)} |
              Credit Debt:{' '}
              {formatCurrency(netWorthDetails.totalCredit, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Your Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            {userWallets.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No wallets configured.
              </p>
            ) : (
              <div className="space-y-4">
                {userWallets.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center">
                      {w.type === 'credit' ? (
                        <CreditCard className="mr-2 h-4 w-4 text-red-500" />
                      ) : (
                        <WalletIcon className="mr-2 h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">{w.label}</span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(w.balance), currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/wallets">
                <Button variant="outline" className="w-full">
                  Manage Wallets
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensesChart
              transactions={userTransactions}
              currency={currency}
            />
            <div className="mt-4">
              <Link href="/transactions">
                <Button variant="outline" className="w-full">
                  View All Transactions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
