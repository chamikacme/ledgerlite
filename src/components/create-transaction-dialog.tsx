"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/responsive-dialog";
import { Plus } from "lucide-react";
import { TransactionForm } from "@/components/transaction-form";

interface Account {
  id: number;
  name: string;
  type: "asset" | "liability" | "expense" | "revenue";
  defaultCategoryId?: number | null;
}

interface Category {
  id: number;
  name: string;
}

export function CreateTransactionDialog({ 
  accounts, 
  categories 
}: { 
  accounts: Account[]; 
  categories: Category[]; 
}) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Transaction
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add Transaction</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Record a new transaction.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <TransactionForm 
          accounts={accounts} 
          categories={categories} 
          onSuccess={() => setOpen(false)} 
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
