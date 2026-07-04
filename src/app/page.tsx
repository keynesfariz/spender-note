import { SyncButton } from '@/components/SyncButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { budgetSettings, transactions, wallets } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { Temporal } from '@js-temporal/polyfill';
import { and, eq, gte, lte, sum, desc } from 'drizzle-orm';
import { CreditCard, Wallet as WalletIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExpensesChart } from '@/components/ExpensesChart';
import { calculatePeriodDates, calculateRemainingBudget, calculateNetWorth } from '@/lib/budget';

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
    .select()
    .from(transactions)
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

    const budget = calculateRemainingBudget(monthlyAmount, totalExpenses, daysRemaining);
    remainingBudget = budget.remainingBudget;
    remainingDailyBudget = budget.remainingDailyBudget;
  }

  // Calculate Net Worth
  const netWorthDetails = calculateNetWorth(userWallets);

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Link href="/settings">
            <Button variant="outline">Settings</Button>
          </Link>
          <SyncButton />
        </div>
      </div>

      {!setting && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            Please configure your budget settings and email filter in the{' '}
            <Link
              href="/settings"
              className="underline font-bold">
              Settings
            </Link>{' '}
            page.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center">
              Remaining Daily Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${remainingDailyBudget.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${remainingBudget.toFixed(2)} total remaining for {daysRemaining}{' '}
              days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center">
              <WalletIcon className="w-4 h-4 mr-2" /> Total Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${netWorthDetails.netWorth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Debit: ${netWorthDetails.totalDebit.toFixed(2)} | Credit Debt: $
              {netWorthDetails.totalCredit.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div className="flex items-center">
                      {w.type === 'credit' ? (
                        <CreditCard className="w-4 h-4 mr-2 text-red-500" />
                      ) : (
                        <WalletIcon className="w-4 h-4 mr-2 text-green-500" />
                      )}
                      <span className="font-medium">{w.label}</span>
                    </div>
                    <span className="font-semibold">
                      ${parseFloat(w.balance).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/wallets">
                <Button
                  variant="outline"
                  className="w-full">
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
            <ExpensesChart transactions={userTransactions} />
            <div className="mt-4">
              <Link href="/transactions">
                <Button
                  variant="outline"
                  className="w-full">
                  View All Transactions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
