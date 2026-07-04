import { pgTable, text, timestamp, integer, uuid, decimal, unique } from "drizzle-orm/pg-core";

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sourceId: text("source_id"), // Unique identifier provided by parser
  label: text("label").notNull(),
  type: text("type").notNull(), // 'debit' or 'credit'
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  statementDayOfMonth: integer("statement_day_of_month"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  unique("user_source_id_idx").on(t.userId, t.sourceId),
]);

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
  activeParsers: text("active_parsers").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});
