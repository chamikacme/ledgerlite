"use client";

import { togglePinAccount } from "@/app/actions/accounts";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {account.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase">
                  {account.type}
                </span>
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
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(account.balance / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: account.currency,
                })}
              </div>
              {account.type === 'liability' && typeof account.statementBalance === 'number' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Statement: {(account.statementBalance / 100).toLocaleString("en-US", { style: "currency", currency: account.currency })}
                </div>
              )}
              {account.type === 'liability' && account.dueDate && (
                <div className="text-xs text-muted-foreground">
                  Due: {new Date(account.dueDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
