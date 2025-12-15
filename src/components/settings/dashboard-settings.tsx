"use client";

import { useTransition, useState } from "react";
import { updateUserSettings } from "@/app/actions/accounts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Account } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DashboardSettingsProps {
  settings: {
    showNetWorth: boolean;
    showMonthlySpending: boolean;
    showDefinedNetWorth: boolean;
    definedNetWorthIncludes: number[];
  };
  accounts: Account[];
}

export function DashboardSettings({ settings, accounts }: DashboardSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  // Local state for immediate UI feedback (optimistic could be added but local state + sync is okay for now)
  // Actually, we can rely on props if we want, but local state makes toggles feel faster if we don't wait for server revalidate.
  // But wait, router.refresh() might take a moment.
  // Let's use local state for the input values, and sync with props.
  const [currentSettings, setCurrentSettings] = useState(settings);

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(newSettings); // Optimistic update

    startTransition(async () => {
      try {
        await updateUserSettings({ [key]: value });
        toast.success("Settings updated");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Failed to update settings");
        setCurrentSettings(settings); // Revert
      }
    });
  };

  const handleAccountToggle = (accountId: number, checked: boolean) => {
    const currentList = currentSettings.definedNetWorthIncludes || [];
    let newList;
    if (checked) {
      newList = [...currentList, accountId];
    } else {
      newList = currentList.filter((id) => id !== accountId);
    }

    const newSettings = { ...currentSettings, definedNetWorthIncludes: newList };
    setCurrentSettings(newSettings);

    startTransition(async () => {
        try {
            await updateUserSettings({ definedNetWorthIncludes: newList });
            // Don't toast for every checkbox click, it's annoying.
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update account selection");
            setCurrentSettings(settings);
        }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Preferences</CardTitle>
        <CardDescription>
            Customize the visibility of cards on your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
                <Label className="text-base">Net Worth Card</Label>
                <CardDescription>
                    Show your total net worth (Assets - Liabilities).
                </CardDescription>
            </div>
            <Switch
                checked={currentSettings.showNetWorth}
                onCheckedChange={(checked) => handleToggle("showNetWorth", checked)}
                disabled={isPending}
            />
        </div>

        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
                <Label className="text-base">Monthly Spending</Label>
                <CardDescription>
                    Show your total spending for the current month.
                </CardDescription>
            </div>
            <Switch
                checked={currentSettings.showMonthlySpending}
                onCheckedChange={(checked) => handleToggle("showMonthlySpending", checked)}
                disabled={isPending}
            />
        </div>

        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
             <div className="space-y-0.5">
                <Label className="text-base">Defined Net Worth</Label>
                <CardDescription>
                    Show a custom net worth card based on specific accounts.
                </CardDescription>
            </div>
            <Switch
                checked={currentSettings.showDefinedNetWorth}
                onCheckedChange={(checked) => handleToggle("showDefinedNetWorth", checked)}
                disabled={isPending}
            />
        </div>

        {currentSettings.showDefinedNetWorth && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                    <h3 className="font-medium">Selected Accounts for Defined Net Worth</h3>
                    <p className="text-sm text-muted-foreground">Select the accounts to include in this calculation.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {accounts.map((account) => (
                        <div key={account.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <Checkbox
                                id={`account-${account.id}`}
                                checked={currentSettings.definedNetWorthIncludes?.includes(account.id)}
                                onCheckedChange={(checked) => handleAccountToggle(account.id, checked as boolean)}
                                disabled={isPending}
                            />
                            <Label
                              htmlFor={`account-${account.id}`}
                              className="font-normal cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {account.name} <span className="text-xs text-muted-foreground ml-1 uppercase">({account.type})</span>
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
