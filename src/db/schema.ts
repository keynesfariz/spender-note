import { pgTable, text, timestamp, integer, uuid, decimal } from "drizzle-orm/pg-core";

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(), // 'debit' or 'credit'
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  statementDayOfMonth: integer("statement_day_of_month"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  emailId: text("email_id").unique(),
  walletId: uuid("wallet_id").references(() => wallets.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  category: text("category").notNull(),
  date: timestamp("date").notNull(),
  remark: text("remark"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetSettings = pgTable("budget_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  resetDayOfMonth: integer("reset_day_of_month").notNull().default(1),
  senderEmailFilter: text("sender_email_filter").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
