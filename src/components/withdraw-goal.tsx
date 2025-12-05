"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { withdrawAndCompleteGoal } from "@/app/actions/goals";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export function WithdrawGoal({ 
  goalId, 
  goalName,
  goalAmount,
  accounts 
}: { 
  goalId: number; 
  goalName: string;
  goalAmount: number;
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const [toAccountId, setToAccountId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleWithdraw() {
    if (!toAccountId) {
      toast.error("Please select an account");
      return;
    }

    setLoading(true);
    try {
      await withdrawAndCompleteGoal(goalId, parseInt(toAccountId));
      toast.success(`🎉 Goal completed! $${(goalAmount / 100).toFixed(2)} transferred to your account`);
      setToAccountId("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to withdraw funds");
    } finally {
      setLoading(false);
    }
  }

  // Filter to show only Asset accounts (excluding goal accounts with 💰 prefix)
  const destinationAccounts = accounts.filter(acc => 
    acc.type === 'asset' && !acc.name.startsWith('💰')
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Withdraw & Complete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🎉 Complete {goalName}</DialogTitle>
          <DialogDescription>
            Congratulations! You've reached your goal. Withdraw the funds to complete it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Amount to Withdraw
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(goalAmount / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Transfer To</label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {destinationAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name} - {(account.balance / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: account.currency,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleWithdraw} className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Completing..." : "Complete Goal & Withdraw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
