"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserSettings } from "@/app/actions/accounts";
import { useCurrency } from "@/contexts/currency-context";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Account } from "@/types";

const formSchema = z.object({
  currency: z.string().min(1, "Currency is required"),
  showNetWorth: z.boolean(),
  showMonthlySpending: z.boolean(),
  showDefinedNetWorth: z.boolean(),
  definedNetWorthIncludes: z.array(z.number()),
});

interface SettingsProps {
  defaultSettings: {
    currency: string;
    showNetWorth: boolean;
    showMonthlySpending: boolean;
    showDefinedNetWorth: boolean;
    definedNetWorthIncludes: number[];
  };
  accounts: Account[];
}

export function SettingsForm({ defaultSettings, accounts }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setCurrency } = useCurrency();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultSettings,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await updateUserSettings(
        values.currency,
        values.showNetWorth,
        values.showMonthlySpending,
        values.showDefinedNetWorth,
        values.definedNetWorthIncludes
      );
      setCurrency(values.currency); // Update local storage cache
      toast.success("Settings updated successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="LKR">LKR (Rs)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dashboard Preferences</h3>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="showNetWorth"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Net Worth Card</FormLabel>
                    <CardDescription>
                      Show your total net worth (Assets - Liabilities).
                    </CardDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="showMonthlySpending"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Monthly Spending</FormLabel>
                    <CardDescription>
                      Show your total spending for the current month.
                    </CardDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="showDefinedNetWorth"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Defined Net Worth</FormLabel>
                    <CardDescription>
                      Show a custom net worth card based on specific accounts.
                    </CardDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {form.watch("showDefinedNetWorth") && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <div className="space-y-2">
              <h3 className="font-medium">Selected Accounts for Defined Net Worth</h3>
              <p className="text-sm text-muted-foreground">Select the accounts to include in this calculation.</p>
            </div>
            <FormField
              control={form.control}
              name="definedNetWorthIncludes"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {accounts.map((account) => (
                      <FormField
                        key={account.id}
                        control={form.control}
                        name="definedNetWorthIncludes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={account.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(account.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, account.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== account.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer text-sm">
                                {account.name} <span className="text-xs text-muted-foreground ml-1 uppercase">({account.type})</span>
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  );
}
