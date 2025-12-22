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
import { AccountForm } from "@/components/account-form";

interface Category {
  id: number;
  name: string;
}

export function CreateAccountDialog({ categories, onAccountCreated }: { categories: Category[], onAccountCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Account
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create New Account</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Add a new account to track your finances.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <AccountForm 
            categories={categories} 
            onSuccess={() => {
                setOpen(false);
                if (onAccountCreated) onAccountCreated();
            }} 
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
