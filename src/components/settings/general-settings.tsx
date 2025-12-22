"use client";

import { useTransition } from "react";
import { updateUserSettings } from "@/app/actions/accounts";
import { useCurrency } from "@/contexts/currency-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { PWAInstallButton } from "@/components/pwa-install-button";

interface GeneralSettingsProps {
  defaultCurrency: string;
}

export function GeneralSettings({ defaultCurrency }: GeneralSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const { setCurrency } = useCurrency();
  const router = useRouter();

  const handleCurrencyChange = (value: string) => {
    startTransition(async () => {
      try {
        await updateUserSettings({ currency: value });
        setCurrency(value);
        toast.success("Currency updated successfully");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Failed to update currency");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Preferences</CardTitle>
        <CardDescription>
          Manage your general application settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="currency">Primary Currency</Label>
          <Select
            defaultValue={defaultCurrency}
            onValueChange={handleCurrencyChange}
            disabled={isPending}
          >
            <SelectTrigger id="currency" className="w-[200px]">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
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
          <p className="text-sm text-muted-foreground">
            This is the default currency used for display throughout the application.
          </p>
        </div>
        
        <PWAInstallButton />
      </CardContent>
    </Card>
  );
}
