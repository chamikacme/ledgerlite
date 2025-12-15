"use client";

import { useEffect, useState } from "react";
import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { deleteTransaction, getTransactions } from "@/app/actions/transactions";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { TransactionWithRelations, Account, Category } from "@/types";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TransactionsPage() {
  const { currency } = useCurrency();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const search = searchParams.get("search") || "";
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
  const sortBy = searchParams.get("sortBy") || "date";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const [data, setData] = useState<{
    accounts: Account[];
    categories: Category[];
    transactions: TransactionWithRelations[];
  } | null>(null);
  
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async (page: number) => {
    const [accounts, categories, transactionsData] = await Promise.all([
      getAccounts(),
      getCategories(),
      getTransactions(page, pageSize, search, from, to, sortBy, sortOrder),
    ]);
    setData({ accounts, categories, transactions: transactionsData.data });
    setTotalCount(transactionsData.meta.totalCount);
    setTotalPages(transactionsData.meta.totalPages);
  };

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage, pageSize, search, from ? from.toISOString() : null, to ? to.toISOString() : null, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    params.set("page", "1"); // Reset to page 1
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleDateChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (range?.from) params.set("from", range.from.toISOString());
    else params.delete("from");
    
    if (range?.to) params.set("to", range.to.toISOString());
    else params.delete("to");
    
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortingChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    // SortingState is {id: string, desc: boolean}[]
    // We only support single column sort for now
    let newSorting: SortingState;
    if (typeof updaterOrValue === 'function') {
        const currentSort: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [];
        newSorting = updaterOrValue(currentSort);
    } else {
        newSorting = updaterOrValue;
    }
    
    const params = new URLSearchParams(searchParams);
    if (newSorting.length > 0) {
        params.set("sortBy", newSorting[0].id);
        params.set("sortOrder", newSorting[0].desc ? "desc" : "asc");
    } else {
        params.delete("sortBy");
        params.delete("sortOrder"); // Default
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newPageSize.toString());
    params.set("page", "1"); // Reset to page 1
    router.push(`${pathname}?${params.toString()}`);
  };

  const onTransactionCreated = () => {
      if (currentPage === 1) {
          loadData(1);
      } else {
          handlePageChange(1);
      }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted");
      loadData(currentPage);
      setDeletingId(null);
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };

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
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingId(row.original.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingId(row.original.id)}
            >
              <Trash className="h-4 w-4 text-destructive" />
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
            onTransactionCreated={onTransactionCreated}
          />
        }
      />



      <DataTable 
        columns={columns} 
        data={transactions} 
        searchKey="description" 
        disablePagination={false}
        pageCount={totalPages}
        page={currentPage}
        onPageChange={handlePageChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        searchValue={search}
        onSearch={handleSearch}
        sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
        onSortingChange={handleSortingChange}
        filterSlot={
            <DatePickerWithRange 
              date={{ from, to }}
              setDate={handleDateChange}
            />
        }
      />
      
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
          onTransactionUpdated={() => loadData(currentPage)}
        />
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction and reverse its balance effects on your accounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => deletingId && handleDelete(deletingId)}
                className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
