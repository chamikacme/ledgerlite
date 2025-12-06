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
import { CategoryForm } from "@/components/category-form";

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create New Category</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Add a new category to organize your transactions.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <CategoryForm onSuccess={() => setOpen(false)} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
