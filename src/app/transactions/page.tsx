"use client";

import { useEffect, useState, useCallback } from "react";
import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { getTransactions } from "@/app/actions/transactions";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { TransactionWithRelations, Account, Category } from "@/types";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const { currency } = useCurrency();
  const [data, setData] = useState<{
    accounts: Account[];
    categories: Category[];
    transactions: TransactionWithRelations[];
  } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const [accounts, categories, transactions] = await Promise.all([
      getAccounts(),
      getCategories(),
      getTransactions(),
    ]);
    setData({ accounts, categories, transactions });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="border rounded-md">
            <div className="h-12 border-b bg-muted/50 px-4 flex items-center">
               <Skeleton className="h-4 w-full" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 border-b px-4 flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { accounts, categories, transactions } = data;
  const editingTransaction = transactions.find(t => t.id === editingId);

  const columns: ColumnDef<TransactionWithRelations>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(row.getValue("date"), "PPP"),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        return category ? (
          <span className="text-xs bg-secondary px-2 py-1 rounded-full inline-block">
            {category.name}
          </span>
        ) : null;
      },
    },
    {
      accessorKey: "fromAccount",
      header: "From Account",
      cell: ({ row }) => {
        const creditEntry = row.original.entries.find(e => e.type === "credit");
        return creditEntry?.account.name || "-";
      },
    },
    {
      accessorKey: "toAccount",
      header: "To Account",
      cell: ({ row }) => {
        const debitEntry = row.original.entries.find(e => e.type === "debit");
        return debitEntry?.account.name || "-";
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-medium text-right">
          {(row.original.amount / 100).toLocaleString("en-US", {
            style: "currency",
            currency: currency,
          })}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingId(row.original.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Transactions"
        action={
          <CreateTransactionDialog 
            accounts={accounts} 
            categories={categories} 
            onTransactionCreated={loadData}
          />
        }
      />

      <DataTable columns={columns} data={transactions} searchKey="description" />
      
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
          onTransactionUpdated={loadData}
        />
      )}
    </div>
  );
}
