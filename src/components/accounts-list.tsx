"use client";

import { togglePinAccount, deleteAccount } from "@/app/actions/accounts";
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { EditAccountDialog } from "@/components/edit-account-dialog";
import { Edit, Pin, PinOff, Trash } from "lucide-react";
import { toast } from "sonner";
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

import { useRouter } from "next/navigation";

export function AccountsList({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

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
              onClick={() => togglePinAccount(account.id, !account.isPinned)}
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
      router.refresh();
      setDeletingId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
      setDeletingId(null);
    }
  };

  return (
    <>
      <DataTable columns={columns} data={accounts} searchKey="name" />

      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          categories={categories}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
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
