import { and, asc, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetSettings, categories, transactions, wallets } from '@/db/schema';
import { PageLayout } from '@/components/PageLayout';
import { createClient } from '@/lib/supabase/server';
import { DataTable } from './data-table';
import { db } from '@/db';

export const metadata: Metadata = {
  title: 'Transactions',
  description:
    'Track, audit, and categorize your capital flow across multiple institutional wallets and accounts.',
};

export default async function TransactionsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const page = Number(searchParams?.page) || 1;
  const pageSize = 25;

  const [setting] = await db
    .select()
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, user.id))
    .limit(1);

  const currency = setting?.currency || 'USD';

  // Extract filters
  const remarkFilter = searchParams?.remark as string;
  const categoryFilter = searchParams?.category as string;
  const walletFilter = searchParams?.wallet as string;
  const minAmount = searchParams?.minAmount
    ? parseFloat(searchParams.minAmount as string)
    : undefined;
  const maxAmount = searchParams?.maxAmount
    ? parseFloat(searchParams.maxAmount as string)
    : undefined;
  const dateFrom = searchParams?.dateFrom as string;
  const dateTo = searchParams?.dateTo as string;

  // Extract sorting
  const sortBy = searchParams?.sortBy as string;
  const sortOrder = searchParams?.sortOrder as string;

  // Build conditions
  const conditions = [eq(transactions.userId, user.id)];

  if (remarkFilter) {
    conditions.push(ilike(transactions.remark, `%${remarkFilter}%`));
  }
  if (categoryFilter) {
    conditions.push(ilike(categories.name, `%${categoryFilter}%`));
  }
  if (walletFilter) {
    conditions.push(ilike(wallets.label, `%${walletFilter}%`));
  }
  if (minAmount !== undefined) {
    conditions.push(gte(transactions.amount, minAmount.toString()));
  }
  if (maxAmount !== undefined) {
    conditions.push(lte(transactions.amount, maxAmount.toString()));
  }
  if (dateFrom) {
    conditions.push(gte(transactions.date, new Date(dateFrom)));
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(transactions.date, toDate));
  }

  // Combine conditions
  const whereClause = and(...conditions);

  // Handle sorting
  let orderClause: any = desc(transactions.date);
  if (sortBy) {
    let sortColumn: any = transactions.date;
    if (sortBy === 'remark') sortColumn = transactions.remark;
    else if (sortBy === 'category') sortColumn = categories.name;
    else if (sortBy === 'amount') sortColumn = transactions.amount;
    else if (sortBy === 'walletLabel') sortColumn = wallets.label;

    orderClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);
  }

  // Fetch count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .leftJoin(wallets, eq(transactions.walletId, wallets.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(whereClause);

  const totalPages = Math.ceil(Number(count) / pageSize);

  // Fetch data
  const userTransactions = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      category: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      date: transactions.date,
      remark: transactions.remark,
      walletLabel: wallets.label,
    })
    .from(transactions)
    .leftJoin(wallets, eq(transactions.walletId, wallets.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(whereClause)
    .orderBy(orderClause)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, user.id));

  const allWallets = await db
    .select({ id: wallets.id, label: wallets.label })
    .from(wallets)
    .where(eq(wallets.userId, user.id));

  return (
    <PageLayout metadata={metadata}>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={userTransactions}
            pageCount={totalPages}
            currency={currency}
            categories={allCategories}
            wallets={allWallets}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
