"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/responsive-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateGoal } from "@/app/actions/goals";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
});

interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export function EditGoalDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: goal.name,
      targetAmount: goal.targetAmount / 100,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("targetAmount", values.targetAmount.toString());

      await updateGoal(goal.id, formData);
      toast.success("Goal updated successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update goal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit Goal</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update your goal name and target amount.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Vacation Fund" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted p-3 rounded text-sm">
              <p className="text-muted-foreground">
                Current progress: ${(goal.currentAmount / 100).toFixed(2)} saved
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Note: Use Contribute/Withdraw buttons to change the current amount
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Updating..." : "Update Goal"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
