import { pgTable, serial, text, timestamp, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'expense', 'revenue']);

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: accountTypeEnum('type').notNull(),
  balance: integer('balance').default(0).notNull(), // In cents
  currency: text('currency').default('USD').notNull(),
  statementBalance: integer('statement_balance'), // For credit cards
  dueDate: timestamp('due_date'), // For credit cards
  defaultCategoryId: integer('default_category_id').references(() => categories.id), // Auto-select category
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: accountTypeEnum('type'), // e.g. 'expense' or 'revenue'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(), // Absolute value in cents
  categoryId: integer('category_id').references(() => categories.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactionEntries = pgTable('transaction_entries', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }).notNull(),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'debit' or 'credit'
  amount: integer('amount').notNull(), // Absolute amount in cents
});

export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  amount: integer('amount').notNull(), // Budget limit in cents
  period: text('period').notNull(), // 'monthly'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  targetAmount: integer('target_amount').notNull(),
  currentAmount: integer('current_amount').default(0).notNull(),
  accountId: integer('account_id').references(() => accounts.id),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  currency: text('currency').default('USD').notNull(),
  showNetWorth: boolean('show_net_worth').default(true).notNull(),
  showMonthlySpending: boolean('show_monthly_spending').default(true).notNull(),
  showDefinedNetWorth: boolean('show_defined_net_worth').default(false).notNull(),
  definedNetWorthIncludes: integer('defined_net_worth_includes').array(), // Account IDs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const recurringTransactions = pgTable('recurring_transactions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  type: text('type').notNull(), // 'withdrawal', 'deposit', 'transfer'
  fromAccountId: integer('from_account_id').references(() => accounts.id),
  toAccountId: integer('to_account_id').references(() => accounts.id),
  frequency: text('frequency').notNull(), // 'daily', 'weekly', 'monthly', 'yearly'
  nextRunDate: timestamp('next_run_date').notNull(),
  lastRunDate: timestamp('last_run_date'),
  active: boolean('active').default(true).notNull(),
  totalOccurrences: integer('total_occurrences'), // null = infinite
  completedOccurrences: integer('completed_occurrences').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  entries: many(transactionEntries),
}));

export const transactionsRelations = relations(transactions, ({ many, one }) => ({
  entries: many(transactionEntries),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const transactionEntriesRelations = relations(transactionEntries, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionEntries.transactionId],
    references: [transactions.id],
  }),
  account: one(accounts, {
    fields: [transactionEntries.accountId],
    references: [accounts.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const shortcuts = pgTable("shortcuts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // emoji or icon name
  fromAccountId: integer("from_account_id").notNull(),
  toAccountId: integer("to_account_id").notNull(),
  categoryId: integer("category_id"),
  type: text("type").notNull().default("withdrawal"), // 'withdrawal', 'deposit', 'transfer'. Default to valid value to migrate easily.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shortcutsRelations = relations(shortcuts, ({ one }) => ({
  fromAccount: one(accounts, {
    fields: [shortcuts.fromAccountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    fields: [shortcuts.toAccountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [shortcuts.categoryId],
    references: [categories.id],
  }),
}));
