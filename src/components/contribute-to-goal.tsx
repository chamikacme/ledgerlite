"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { contributeToGoal } from "@/app/actions/goals";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export function ContributeToGoal({ 
  goalId, 
  goalName, 
  accounts 
}: { 
  goalId: number; 
  goalName: string;
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleContribute() {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!fromAccountId) {
      toast.error("Please select an account");
      return;
    }

    setLoading(true);
    try {
      await contributeToGoal(goalId, parseInt(fromAccountId), parseFloat(amount));
      toast.success(`Transferred $${parseFloat(amount).toFixed(2)} to ${goalName}`);
      setAmount("");
      setFromAccountId("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to transfer funds");
    } finally {
      setLoading(false);
    }
  }

  // Filter to show only Asset accounts (excluding goal accounts with 💰 prefix)
  const sourceAccounts = accounts.filter(acc => 
    acc.type === 'asset' && !acc.name.startsWith('💰')
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full mt-2">
          <PlusCircle className="mr-2 h-4 w-4" />
          Contribute
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contribute to {goalName}</DialogTitle>
          <DialogDescription>
            Transfer money from an account to this savings goal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Account</label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {sourceAccounts.map((account) => (
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleContribute();
              }}
            />
          </div>
          <Button onClick={handleContribute} className="w-full" disabled={loading}>
            {loading ? "Transferring..." : "Transfer Funds"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
