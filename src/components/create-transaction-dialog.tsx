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
import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
  accounts: initialAccounts, 
  categories: initialCategories,
  onTransactionCreated,
}: { 
  accounts?: Account[]; 
  categories?: Category[]; 
  onTransactionCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[] | undefined>(initialAccounts);
  const [categories, setCategories] = useState<Category[] | undefined>(initialCategories);
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = async () => {
    if (accounts && categories) return;
    
    setIsFetching(true);
    try {
      const [accs, cats] = await Promise.all([
        !accounts ? getAccounts() : Promise.resolve(accounts),
        !categories ? getCategories() : Promise.resolve(categories),
      ]);
      setAccounts(accs as Account[]);
      setCategories(cats as Category[]);
    } catch (error) {
      toast.error("Failed to load accounts and categories");
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchData();
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
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
        
        {isFetching ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
               </div>
               <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
               </div>
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ) : accounts && categories ? (
          <TransactionForm 
            accounts={accounts} 
            categories={categories} 
            onSuccess={() => {
              setOpen(false);
              onTransactionCreated?.();
            }} 
          />
        ) : (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
             Failed to load transaction data.
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
