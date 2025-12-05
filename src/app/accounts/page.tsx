import { getAccounts } from "@/app/actions/accounts";
import { getGoals } from "@/app/actions/goals";
import { getCategories } from "@/app/actions/categories";
import { AccountForm } from "@/components/account-form";
import { AccountsList } from "@/components/accounts-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default async function AccountsPage() {
  const allAccounts = await getAccounts();
  const goals = await getGoals();
  const categories = await getCategories();
  
  // Get account IDs of completed goals
  const completedGoalAccountIds = goals
    .filter(g => g.completed && g.accountId)
    .map(g => g.accountId);
  
  // Filter out accounts linked to completed goals
  const accounts = allAccounts.filter(
    account => !completedGoalAccountIds.includes(account.id)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Add a new account to track your finances.
              </DialogDescription>
            </DialogHeader>
            <AccountForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <AccountsList accounts={accounts} categories={categories} />
    </div>
  );
}
