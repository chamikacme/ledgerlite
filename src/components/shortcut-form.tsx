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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createShortcut, updateShortcut } from "@/app/actions/shortcuts";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  fromAccountId: z.string().min(1, "From account is required"),
  toAccountId: z.string().min(1, "To account is required"),
  categoryId: z.string().optional(),
});

const emojiOptions = ["⚡", "🍕", "🚗", "🏠", "💡", "📱", "🛒", "💰", "🎮", "☕", "🎬", "🏥"];

interface ShortcutFormProps {
  shortcut?: any;
  accounts: any[];
  categories: any[];
  onSuccess?: () => void;
}

export function ShortcutForm({ shortcut, accounts, categories, onSuccess }: ShortcutFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: shortcut?.name || "",
      description: shortcut?.description || "",
      icon: shortcut?.icon || "⚡",
      fromAccountId: shortcut?.fromAccountId?.toString() || "",
      toAccountId: shortcut?.toAccountId?.toString() || "",
      categoryId: shortcut?.categoryId?.toString() || "",
    },
  });

  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("icon", values.icon || "⚡");
      formData.append("fromAccountId", values.fromAccountId);
      formData.append("toAccountId", values.toAccountId);
      if (values.categoryId) {
        formData.append("categoryId", values.categoryId);
      }

      if (shortcut) {
        await updateShortcut(shortcut.id, formData);
        toast.success("Shortcut updated successfully");
      } else {
        await createShortcut(formData);
        toast.success("Shortcut created successfully");
      }

      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${shortcut ? "update" : "create"} shortcut`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <div className="grid grid-cols-6 gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => field.onChange(emoji)}
                      className={`text-3xl p-2 rounded-lg border-2 transition-colors ${
                        field.value === emoji
                          ? "border-primary bg-primary/10"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Coffee" {...field} />
              </FormControl>
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
                <Textarea placeholder="Optional description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fromAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Account *</FormLabel>
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
              <FormDescription>Account money comes from</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="toAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To Account *</FormLabel>
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
              <FormDescription>Account money goes to</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : shortcut ? "Update Shortcut" : "Create Shortcut"}
        </Button>
      </form>
    </Form>
  );
}
