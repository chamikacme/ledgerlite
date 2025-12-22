"use client";

import { togglePinAccount, deleteAccount } from "@/app/actions/accounts";
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { EditAccountDialog } from "@/components/edit-account-dialog";
import { Edit, Pin, PinOff, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  statementBalance?: number | null;
  dueDate?: Date | null;
  defaultCategoryId?: number | null;
  isPinned: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface AccountsListProps {
    accounts: Account[];
    categories: Category[];
    meta: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    }
    search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    isLoading?: boolean;
    onRefresh?: () => void;
}

export function AccountsList({ accounts, categories, meta, search, sortBy, sortOrder, isLoading, onRefresh }: AccountsListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
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

  const editingAccount = accounts.find(a => a.id === editingId);

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground uppercase">
          {row.getValue("type")}
        </span>
      ),
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="font-medium">
            {(account.balance / 100).toLocaleString("en-US", {
              style: "currency",
              currency: account.currency,
            })}
          </div>
        );
      },
    },
    {
      id: "linkedCategory",
      header: "Linked Category",
      cell: ({ row }) => {
        const account = row.original;
        if (account.defaultCategoryId) {
            const category = categories.find(c => c.id === account.defaultCategoryId);
            return category ? (
                <span className="text-xs bg-secondary px-2 py-1 rounded-full">{category.name}</span>
            ) : null;
        }
        return <span className="text-xs text-muted-foreground">-</span>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              title={account.isPinned ? "Unpin account" : "Pin account"}
              onClick={async () => {
                  try {
                    await togglePinAccount(account.id, !account.isPinned);
                    if (onRefresh) onRefresh();
                    else router.refresh();
                  } catch (error) {
                    toast.error("Failed to pin/unpin account");
                  }
              }}
            >
              {account.isPinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingId(account.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeletingId(account.id)}
            >
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
      size: 100,
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await deleteAccount(id);
      toast.success("Account deleted");
      if (onRefresh) onRefresh();
      else router.refresh();
      setDeletingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
      setDeletingId(null);
    }
  };

  return (
    <>
      <DataTable 
        columns={columns} 
        data={accounts} 
        searchKey="name" 
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

      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          categories={categories}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
          onAccountUpdated={onRefresh}
        />
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account.
              You cannot delete accounts that have related transactions, goals, or recurring payments.
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
    </>
  );
}
