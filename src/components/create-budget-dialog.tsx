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
import { BudgetForm } from "@/components/budget-form";

interface Category {
  id: number;
  name: string;
}

export function CreateBudgetDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Set Budget
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Set Monthly Budget</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Set a spending limit for a category.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <BudgetForm categories={categories} onSuccess={() => setOpen(false)} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
