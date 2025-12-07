// Database types
export type AccountType = 'asset' | 'liability' | 'expense' | 'revenue';
export type TransactionType = 'withdrawal' | 'deposit' | 'transfer';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type EntryType = 'debit' | 'credit';

export interface Account {
  id: number;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  statementBalance: number | null;
  dueDate: Date | null;
  defaultCategoryId: number | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  userId: string;
  name: string;
  type: AccountType | null;
  createdAt: Date;
}

export interface Transaction {
  id: number;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  categoryId: number | null;
  createdAt: Date;
}

export interface TransactionEntry {
  id: number;
  transactionId: number;
  accountId: number;
  type: string;
  amount: number;
}

export interface Budget {
  id: number;
  userId: string;
  categoryId: number;
  amount: number;
  period: string;
  createdAt: Date;
}

export interface BudgetWithProgress extends Budget {
  category: Category;
  spent: number;
  remaining: number;
  progress: number;
}

export interface Goal {
  id: number;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  accountId: number | null;
  completed: boolean;
  createdAt: Date;
}

export interface RecurringTransaction {
  id: number;
  userId: string;
  description: string;
  amount: number;
  categoryId: number | null;
  type: string;
  fromAccountId: number | null;
  toAccountId: number | null;
  frequency: string;
  nextRunDate: Date;
  lastRunDate: Date | null;
  active: boolean;
  totalOccurrences: number | null;
  completedOccurrences: number;
  createdAt: Date;
}

export interface Shortcut {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  icon: string | null;
  fromAccountId: number;
  toAccountId: number;
  categoryId: number | null;
  type: string;
  createdAt: Date;
}

export interface JournalEntry {
  id: number;
  date: Date;
  description: string;
  accountName: string;
  type: EntryType;
  amount: number;
}

export interface TransactionWithRelations extends Transaction {
  category: Category | null;
  entries: Array<TransactionEntry & {
    account: Account;
  }>;
}

export interface ShortcutWithRelations extends Shortcut {
  fromAccount: Account;
  toAccount: Account;
  category: Category | null;
}
