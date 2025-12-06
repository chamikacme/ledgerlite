"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/responsive-dialog";
import { ShortcutForm } from "@/components/shortcut-form";

interface EditShortcutDialogProps {
  shortcut: any;
  accounts: any[];
  categories: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditShortcutDialog({
  shortcut,
  accounts,
  categories,
  open,
  onOpenChange,
}: EditShortcutDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit Shortcut</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update your transaction shortcut
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ShortcutForm
          shortcut={shortcut}
          accounts={accounts}
          categories={categories}
          onSuccess={() => onOpenChange(false)}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
