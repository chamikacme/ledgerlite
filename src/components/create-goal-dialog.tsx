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
import { GoalForm } from "@/components/goal-form";

export function CreateGoalDialog() {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create Savings Goal</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Set a target for something you want to buy.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <GoalForm onSuccess={() => setOpen(false)} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
