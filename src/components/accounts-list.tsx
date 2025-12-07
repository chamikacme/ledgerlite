"use client";

import { togglePinAccount } from "@/app/actions/accounts";
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { EditAccountDialog } from "@/components/edit-account-dialog";
import { Edit, Pin, PinOff } from "lucide-react";

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

export function AccountsList({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

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
      id: "details",
      header: "Details",
      cell: ({ row }) => {
        const account = row.original;
        if (account.type === 'liability' && typeof account.statementBalance === 'number') {
           return (
             <div className="text-xs text-muted-foreground">
               Statement: {(account.statementBalance / 100).toLocaleString("en-US", { style: "currency", currency: account.currency })}
               {account.dueDate && (
                 <span className="ml-2">
                   Due: {new Date(account.dueDate).toLocaleDateString()}
                 </span>
               )}
             </div>
           )
        }
        return null;
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
          </div>
        );
      },
      size: 100,
    },
  ];

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
    </>
  );
}
