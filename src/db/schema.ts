import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  decimal,
  unique,
} from 'drizzle-orm/pg-core';

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  sourceIds: text('source_ids').array().notNull().default([]), // Unique identifiers provided by parsers
  label: text('label').notNull(),
  type: text('type').notNull(), // 'debit' or 'credit'
  balance: decimal('balance', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }),
  statementDayOfMonth: integer('statement_day_of_month'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [unique('user_category_name_idx').on(t.userId, t.name)],
);

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  emailId: text('email_id').unique(),
  walletId: uuid('wallet_id')
    .references(() => wallets.id)
    .notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  type: text('type').notNull(), // 'income' or 'expense'
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  date: timestamp('date').notNull(),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const budgetSettings = pgTable('budget_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  monthlyAmount: decimal('monthly_amount', {
    precision: 12,
    scale: 2,
  }).notNull(),
  resetDayOfMonth: integer('reset_day_of_month').notNull().default(1),
  activeParsers: text('active_parsers').array().notNull().default([]),
  aiCustomEmails: text('ai_custom_emails').array().notNull().default([]),
  currency: text('currency').notNull().default('USD'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ignoredEmails = pgTable('ignored_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  emailId: text('email_id').unique().notNull(),
  reason: text('reason'),
  emailDate: timestamp('email_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
