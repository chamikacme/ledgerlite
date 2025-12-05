"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { createRecurringTransaction } from "@/app/actions/recurring";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().optional(),
  type: z.enum(["withdrawal", "deposit", "transfer"]),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  occurrenceType: z.enum(["infinite", "limited"]),
  totalOccurrences: z.coerce.number().int().positive().optional(),
});

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export function RecurringTransactionForm({
  accounts,
  categories,
  onSuccess,
}: {
  accounts: Account[];
  categories: Category[];
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      categoryId: "",
      type: "withdrawal" as "withdrawal" | "deposit" | "transfer",
      fromAccountId: "",
      toAccountId: "",
      frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
      startDate: new Date().toISOString().split('T')[0],
      occurrenceType: "infinite" as "infinite" | "limited",
      totalOccurrences: undefined,
    },
  });

  const type = form.watch("type");
  const occurrenceType = form.watch("occurrenceType");

  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("description", values.description);
      formData.append("amount", values.amount.toString());
      if (values.categoryId && values.categoryId !== "") formData.append("categoryId", values.categoryId);
      formData.append("type", values.type);
      if (values.fromAccountId && values.fromAccountId !== "") formData.append("fromAccountId", values.fromAccountId);
      if (values.toAccountId && values.toAccountId !== "") formData.append("toAccountId", values.toAccountId);
      formData.append("frequency", values.frequency);
      formData.append("startDate", values.startDate);
      if (values.occurrenceType === "limited" && values.totalOccurrences) {
        formData.append("totalOccurrences", values.totalOccurrences.toString());
      }

      await createRecurringTransaction(formData);
      toast.success("Recurring transaction created");
      form.reset();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create recurring transaction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Rent" {...field} />
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

        {(type === "withdrawal" || type === "transfer") && (
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
                    {accounts.map((account) => (
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
        )}

        {(type === "deposit" || type === "transfer") && (
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
                    {accounts.map((account) => (
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
        )}

        {type === "withdrawal" && (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
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
        )}

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
            name="startDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {/* Occurrences */}
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
                <FormLabel>Number of Occurrences</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="e.g., 12" {...field} value={field.value as number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Recurring Transaction"}
        </Button>
      </form>
    </Form>
  );
}
