"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/responsive-dialog";
import { RecurringTransactionForm } from "@/components/recurring-form";
import { EditRecurringDialog } from "@/components/edit-recurring-dialog";
import {
  deleteRecurringTransaction,
  toggleRecurringTransaction,
  executeRecurringTransaction,
  skipRecurringTransaction,
} from "@/app/actions/recurring";
import { Plus, PlayCircle, SkipForward, Edit, Pause, Play, Trash2, Calendar, Infinity } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, isPast, differenceInDays } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef, SortingState } from "@tanstack/react-table";

import type { Account, Category, RecurringTransaction } from "@/types";

function getStatusInfo(rt: RecurringTransaction) {
  const now = new Date();
  const nextDate = new Date(rt.nextRunDate);
  const daysUntil = differenceInDays(nextDate, now);
  
  if (!rt.active) {
    const isCompleted = rt.totalOccurrences && rt.completedOccurrences >= rt.totalOccurrences;
    return {
      badge: isCompleted ? "✅ Completed" : "⏸️ Paused",
      color: isCompleted ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
  }
  
  if (isPast(nextDate)) {
    return {
      badge: "🔴 Overdue",
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
  }
  
  if (daysUntil <= 7) {
    return {
      badge: "🟡 Due Soon",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
  }
  
  return {
    badge: "🟢 Active",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };
}

export function RecurringPageClient({
  recurringTransactions,
  accounts,
  categories,
  meta,
  search,
  sortBy,
  sortOrder,
  isLoading,
  onRefresh,
}: {
  recurringTransactions: RecurringTransaction[];
  accounts: Account[];
  categories: Category[];
  meta: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
  };
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  isLoading?: boolean;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [loading, setLoading] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creationOpen, setCreationOpen] = useState(false);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newPageSize.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const handleSortingChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
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
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this recurring transaction?")) return;
    
    setLoading(id);
    try {
      await deleteRecurringTransaction(id);
      toast.success("Recurring transaction deleted");
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    } finally {
      setLoading(null);
    }
  }

  async function handleToggle(id: number) {
    setLoading(id);
    try {
      await toggleRecurringTransaction(id);
      toast.success("Status updated");
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
    }
  }

  async function handleExecute(id: number) {
    setLoading(id);
    try {
      await executeRecurringTransaction(id);
      toast.success("Transaction executed");
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to execute");
    } finally {
      setLoading(null);
    }
  }

  async function handleSkip(id: number) {
    setLoading(id);
    try {
      await skipRecurringTransaction(id);
      toast.success("Transaction skipped");
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to skip");
    } finally {
      setLoading(null);
    }
  }

  const editingTransaction = recurringTransactions.find(rt => rt.id === editingId);

  const columns: ColumnDef<RecurringTransaction>[] = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const rt = row.original;
        return (
          <div>
            <div className="font-medium">{rt.description}</div>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span className="capitalize">{rt.frequency}</span></span>
              <span>• Next: {format(new Date(rt.nextRunDate), "MMM d, yyyy")}</span>
               {rt.lastRunDate && (
                  <span>• Last: {format(new Date(rt.lastRunDate), "MMM d, yyyy")}</span>
               )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-medium">
           {(row.original.amount / 100).toLocaleString("en-US", {
             style: "currency",
             currency: "LKR",
           })}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getStatusInfo(row.original);
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded ${status.color}`}>
            {status.badge}
          </span>
        );
      },
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const rt = row.original;
        return (
           <div className="flex items-center gap-1 text-sm">
             {rt.totalOccurrences ? (
               <span>{rt.completedOccurrences}/{rt.totalOccurrences}</span>
             ) : (
               <>
                 <Infinity className="h-3 w-3" />
                 <span>({rt.completedOccurrences})</span>
               </>
             )}
           </div>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const rt = row.original;
        return (
          <div className="flex flex-wrap gap-1">
             <Button
                size="icon"
                variant="ghost"
                title="Execute"
                onClick={() => handleExecute(rt.id)}
                disabled={!rt.active || loading === rt.id}
             >
                <PlayCircle className="h-4 w-4" />
             </Button>
             <Button
                size="icon"
                variant="ghost"
                title="Skip"
                onClick={() => handleSkip(rt.id)}
                disabled={!rt.active || loading === rt.id}
             >
                <SkipForward className="h-4 w-4" />
             </Button>
             <Button
                size="icon"
                variant="ghost"
                title="Edit"
                onClick={() => setEditingId(rt.id)}
                disabled={loading === rt.id}
             >
                <Edit className="h-4 w-4" />
             </Button>
             <Button
                size="icon"
                variant="ghost"
                title={rt.active ? "Pause" : "Resume"}
                onClick={() => handleToggle(rt.id)}
                disabled={loading === rt.id}
             >
                {rt.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
             </Button>
             <Button
                size="icon"
                variant="ghost"
                title="Delete"
                onClick={() => handleDelete(rt.id)}
                disabled={loading === rt.id}
                className="text-destructive hover:text-destructive"
             >
                <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        )
      }
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Recurring Transactions"
        action={
          <ResponsiveDialog open={creationOpen} onOpenChange={setCreationOpen}>
            <ResponsiveDialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Recurring Transaction
              </Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Create Recurring Transaction</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  Set up automated recurring payments or income.
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <RecurringTransactionForm 
                accounts={accounts} 
                categories={categories} 
                onSuccess={() => {
                   setCreationOpen(false);
                   if (onRefresh) onRefresh();
                   else router.refresh();
                }}
              />
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        }
      />

      <DataTable 
        columns={columns} 
        data={recurringTransactions} 
        searchKey="description" 
        disablePagination={false}
        pageCount={meta.totalPages}
        page={meta.page}
        onPageChange={handlePageChange}
        pageSize={meta.pageSize}
        onPageSizeChange={handlePageSizeChange}
        searchValue={search}
        onSearch={handleSearch}
        sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
        onSortingChange={handleSortingChange}
        isLoading={isLoading}
      />

      {editingTransaction && (
        <EditRecurringDialog
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
          onTransactionUpdated={onRefresh}
        />
      )}
    </div>
  );
}
