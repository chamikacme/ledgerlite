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
import { ShortcutForm } from "@/components/shortcut-form";
import { Plus } from "lucide-react";
import type { Account, Category } from "@/types";

interface CreateShortcutDialogProps {
  accounts: Account[];
  categories: Category[];
}

export function CreateShortcutDialog({ accounts, categories }: CreateShortcutDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Shortcut
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create Shortcut</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Create a quick shortcut for frequent transactions
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ShortcutForm
          accounts={accounts}
          categories={categories}
          onSuccess={() => setOpen(false)}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
