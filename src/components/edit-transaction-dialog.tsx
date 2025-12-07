"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/responsive-dialog";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionWithRelations, Account, Category } from "@/types";

interface EditTransactionDialogProps {
  transaction: TransactionWithRelations;
  accounts: Account[];
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated?: () => void;
}

export function EditTransactionDialog({
  transaction,
  accounts,
  categories,
  open,
  onOpenChange,
  onTransactionUpdated,
}: EditTransactionDialogProps) {
  
  // Logic to determine type and accounts
  let type: "withdrawal" | "deposit" | "transfer" = "withdrawal";
  let fromAccountId = "";
  let toAccountId = "";

  // find entries
  const debitEntries = transaction.entries.filter(e => e.type === 'debit');
  const creditEntries = transaction.entries.filter(e => e.type === 'credit');

  if (debitEntries.length > 0 && creditEntries.length > 0) {
      const debitEntry = debitEntries[0];
      const creditEntry = creditEntries[0];
      
      const debitAccount = debitEntry.account;
      const creditAccount = creditEntry.account;

      // Logic to infer transaction type based on involved accounts
      if (creditAccount.type === 'revenue') {
          type = "deposit";
          fromAccountId = creditAccount.id.toString();
          toAccountId = debitAccount.id.toString();
      } else if (debitAccount.type === 'expense') {
          type = "withdrawal";
          fromAccountId = creditAccount.id.toString();
          toAccountId = debitAccount.id.toString();
      } else {
          // If neither revenue source nor expense destination, likely a transfer
          // e.g. Asset -> Asset, Asset -> Liability, Liability -> Asset
          type = "transfer";
          fromAccountId = creditAccount.id.toString();
          toAccountId = debitAccount.id.toString();
      }
  }

  const defaultValues = {
    date: new Date(transaction.date),
    description: transaction.description,
    amount: transaction.amount / 100,
    type,
    fromAccountId,
    toAccountId,
    categoryId: transaction.categoryId ? transaction.categoryId.toString() : undefined,
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit Transaction</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <TransactionForm
          accounts={accounts}
          categories={categories}
          defaultValues={defaultValues}
          transactionId={transaction.id}
          onSuccess={() => {
            onOpenChange(false);
            onTransactionUpdated?.();
          }}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
