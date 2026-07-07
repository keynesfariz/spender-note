import { and, asc, desc, eq, gte, ilike, isNull, lte, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import {
  getCachedBudgetSettings,
  getCachedCategories,
  getCachedWallets,
} from '@/lib/data-cache';
import { TransactionsClient } from './components/transactions-client';
import { categories, transactions, wallets } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
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
    if (categoryFilter === 'NULL') {
      conditions.push(isNull(transactions.categoryId));
    } else {
      conditions.push(eq(transactions.categoryId, categoryFilter));
    }
  }
  if (walletFilter) {
    conditions.push(eq(transactions.walletId, walletFilter));
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

  const [
    [{ count }],
    userTransactions,
    allCategories,
    allWallets,
    [setting]
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(whereClause),
    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        category: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
        categoryId: transactions.categoryId,
        date: transactions.date,
        remark: transactions.remark,
        walletLabel: wallets.label,
        walletId: transactions.walletId,
        emailId: transactions.emailId,
      })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    getCachedCategories(user.id),
    getCachedWallets(user.id),
    getCachedBudgetSettings(user.id)
  ]);

  const totalPages = Math.ceil(Number(count) / pageSize);
  const currency = setting?.currency || 'USD';

  return (
    <TransactionsClient
      data={userTransactions}
      pageCount={totalPages}
      currency={currency}
      categories={allCategories}
      wallets={allWallets}
    />
  );
}
