import { getAccounts, getUserSettings } from "@/app/actions/accounts";
import { getBudgets } from "@/app/actions/budgets";
import { getTransactions } from "@/app/actions/transactions";
import { getUpcomingRecurringTransactions } from "@/app/actions/recurring";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UpcomingPayments } from "@/components/upcoming-payments";
import { format } from "date-fns";

export default async function DashboardPage() {
  const settings = await getUserSettings();

  if (!settings) {
    redirect("/setup");
  }

  const accounts = await getAccounts();
  const budgets = await getBudgets();
  const transactions = await getTransactions();
  const upcomingPayments = await getUpcomingRecurringTransactions();

  // Calculate Net Worth
  const netWorth = accounts.reduce((acc, account) => {
    if (account.type === "asset") return acc + account.balance;
    if (account.type === "liability") return acc - account.balance;
    return acc;
  }, 0);

  // Calculate Monthly Spending
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlySpending = transactions
    .filter(
      (t) =>
        t.date >= startOfMonth &&
        t.entries.some((e) => e.type === "debit" && (e.account.type === "expense" || e.account.type === "liability")) // Simplified logic
    )
    .reduce((acc, t) => acc + t.amount, 0);
    
    // Actually, spending is better calculated from budgets or category tracking.
    // Let's use the sum of 'spent' from budgets for tracked categories, 
    // plus any other expenses.
    // For now, let's just sum up all withdrawals for simplicity in this view.
    const monthlyWithdrawals = transactions
        .filter(t => t.date >= startOfMonth && 
            t.entries.some(e => e.type === 'credit' && e.account.type === 'asset') && // Money leaving asset
            t.entries.some(e => e.type === 'debit' && (e.account.type === 'expense' || e.account.type === 'liability')) // Going to expense/liability
        )
        .reduce((acc, t) => acc + t.amount, 0);


  const pinnedAccounts = accounts.filter(a => a.isPinned);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        action={<UserButton />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(netWorth / 100).toLocaleString("en-US", {
                style: "currency",
                currency: settings.currency,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(monthlyWithdrawals / 100).toLocaleString("en-US", {
                style: "currency",
                currency: settings.currency,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {pinnedAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Pinned Accounts</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pinnedAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {account.name}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground uppercase">
                    {account.type}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(account.balance / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: account.currency,
                    })}
                  </div>
                  {account.type === 'liability' && typeof account.statementBalance === 'number' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Statement: {(account.statementBalance / 100).toLocaleString("en-US", { style: "currency", currency: account.currency })}
                    </div>
                  )}
                  {account.type === 'liability' && account.dueDate && (
                    <div className="text-xs text-muted-foreground">
                      Due: {new Date(account.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Payments Section */}
      {upcomingPayments.length > 0 && (
        <UpcomingPayments transactions={upcomingPayments} />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(transaction.date, "PPP")}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {(transaction.amount / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: settings.currency,
                    })}
                  </div>
                </div>
              ))}
               {transactions.length === 0 && (
                  <div className="text-center text-muted-foreground">
                      No recent transactions.
                  </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {budgets.slice(0, 5).map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">{budget.category.name}</div>
                    <div className="text-muted-foreground">
                      {Math.round(budget.progress)}%
                    </div>
                  </div>
                  <Progress value={budget.progress} />
                </div>
              ))}
               {budgets.length === 0 && (
                  <div className="text-center text-muted-foreground">
                      No budgets set.
                  </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
