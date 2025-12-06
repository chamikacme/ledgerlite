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
import { createAccount } from "@/app/actions/accounts";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["asset", "liability", "expense", "revenue"]),
  balance: z.coerce.number().default(0),
  currency: z.string().default("LKR"),
  statementBalance: z.coerce.number().optional(),
  dueDate: z.coerce.date().optional(),
  defaultCategoryId: z.string().optional(),
});

interface Category {
  id: number;
  name: string;
}

export function AccountForm({ 
  categories = [],
  onSuccess 
}: { 
  categories?: Category[];
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "asset" as "asset" | "liability" | "expense" | "revenue",
      balance: 0,
      currency: "LKR",
      statementBalance: 0,
      dueDate: undefined,
      defaultCategoryId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("balance", values.balance.toString());
      formData.append("currency", values.currency);
      if (values.statementBalance) formData.append("statementBalance", values.statementBalance.toString());
      if (values.dueDate) formData.append("dueDate", values.dueDate.toISOString());
      if (values.defaultCategoryId) formData.append("defaultCategoryId", values.defaultCategoryId);

      await createAccount(formData);
      toast.success("Account created successfully");
      form.reset();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Chase Checking" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Balance</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={field.value as number} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch("type") === "liability" && (
            <>
                <FormField
                  control={form.control}
                  name="statementBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statement Balance (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value as number} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ? new Date(field.value as Date).toISOString().split('T')[0] : ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </>
        )}

        <FormField
          control={form.control}
          name="defaultCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Category (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-select category when account is used" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
