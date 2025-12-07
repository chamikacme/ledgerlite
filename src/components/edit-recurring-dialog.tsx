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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRecurringTransaction } from "@/app/actions/recurring";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().optional(),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  nextRunDate: z.string().min(1, "Next run date is required"),
  occurrenceType: z.enum(["infinite", "limited"]),
  totalOccurrences: z.coerce.number().int().positive().optional(),
});

import type { Account, Category, RecurringTransaction } from "@/types";

export function EditRecurringDialog({
  transaction,
  accounts,
  categories,
  open,
  onOpenChange,
}: {
  transaction: RecurringTransaction;
  accounts: Account[];
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction.description,
      amount: transaction.amount / 100,
      categoryId: transaction.categoryId?.toString() || "",
      fromAccountId: transaction.fromAccountId?.toString() || "",
      toAccountId: transaction.toAccountId?.toString() || "",
      frequency: transaction.frequency as "daily" | "weekly" | "monthly" | "yearly",
      nextRunDate: new Date(transaction.nextRunDate).toISOString().split('T')[0],
      occurrenceType: (transaction.totalOccurrences ? "limited" : "infinite") as "infinite" | "limited",
      totalOccurrences: transaction.totalOccurrences || undefined,
    },
  });

  const occurrenceType = form.watch("occurrenceType");
  const type = transaction.type;

  const fromAccounts = accounts.filter((acc) => {
    if (type === "withdrawal") return acc.type === "asset" || acc.type === "liability";
    if (type === "deposit") return acc.type === "revenue";
    if (type === "transfer") return acc.type === "asset" || acc.type === "liability";
    return true;
  });

  const toAccounts = accounts.filter((acc) => {
    if (type === "withdrawal") return acc.type === "expense" || acc.type === "liability";
    if (type === "deposit") return acc.type === "asset";
    if (type === "transfer") return acc.type === "asset" || acc.type === "liability";
    return true;
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("description", values.description);
      formData.append("amount", values.amount.toString());
      if (values.categoryId && values.categoryId !== "") formData.append("categoryId", values.categoryId);
      if (values.fromAccountId && values.fromAccountId !== "") formData.append("fromAccountId", values.fromAccountId);
      if (values.toAccountId && values.toAccountId !== "") formData.append("toAccountId", values.toAccountId);
      formData.append("frequency", values.frequency);
      formData.append("nextRunDate", values.nextRunDate);
      if (values.occurrenceType === "limited" && values.totalOccurrences) {
        formData.append("totalOccurrences", values.totalOccurrences.toString());
      }

      await updateRecurringTransaction(transaction.id, formData);
      toast.success("Recurring transaction updated");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update recurring transaction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit Recurring Transaction</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update the details of your recurring transaction.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fromAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {toAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextRunDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Run Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="occurrenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occurrences</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="infinite">∞ Infinite</SelectItem>
                      <SelectItem value="limited">Limited Number</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {occurrenceType === "limited" && (
              <FormField
                control={form.control}
                name="totalOccurrences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Occurrences</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} value={field.value as number} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Completed: {transaction.completedOccurrences}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Updating..." : "Update"}
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
