import { getAccounts, getUserSettings } from "@/app/actions/accounts";
import { getBudgets } from "@/app/actions/budgets";
import { getMonthlySpending, getRecentTransactions } from "@/app/actions/dashboard";
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
import { UpcomingPayments } from "@/components/upcoming-payments";
import { format } from "date-fns";
import { 
  Wallet, 
  CreditCard, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  Building2, 
  Landmark, 
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Receipt
} from "lucide-react";

export default async function DashboardPage() {
  const settings = await getUserSettings();

  if (!settings) {
    redirect("/setup");
  }

  const accounts = await getAccounts();
  const budgets = await getBudgets();
  const monthlyWithdrawals = await getMonthlySpending();
  const recentTransactions = await getRecentTransactions(5);
  const upcomingPayments = await getUpcomingRecurringTransactions();

  const now = new Date();

  // Calculate Net Worth
  const netWorth = accounts.reduce((acc, account) => {
    if (account.type === "asset") return acc + account.balance;
    if (account.type === "liability") return acc - account.balance;
    return acc;
  }, 0);

  // Calculate Defined Net Worth
  const showDefinedNetWorth = settings.showDefinedNetWorth;
  const defineNetWorthAccounts = settings.definedNetWorthIncludes || [];
  
  const definedNetWorth = accounts.reduce((acc, account) => {
    if (defineNetWorthAccounts.includes(account.id)) {
        if (account.type === "asset") return acc + account.balance;
        if (account.type === "liability") return acc - account.balance;
    }
    return acc;
  }, 0);

  const pinnedAccounts = accounts.filter(a => a.isPinned);

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
         <PageHeader
           title="Welcome Back"
           description="Here's what's happening with your finances today."
         />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {settings.showNetWorth !== false && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(netWorth / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: settings.currency,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Total assets minus liabilities
              </p>
            </CardContent>
          </Card>
        )}

        {showDefinedNetWorth && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Defined Net Worth</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(definedNetWorth / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: settings.currency,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {defineNetWorthAccounts.length} selected accounts
              </p>
            </CardContent>
          </Card>
        )}

        {settings.showMonthlySpending !== false && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Spending
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(monthlyWithdrawals / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: settings.currency,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(now, "MMMM yyyy")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">

         {/* Pinned Accounts */}
         {pinnedAccounts.length > 0 && (
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Pinned Accounts</h2>
              </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pinnedAccounts.map((account) => {
                 const isLiability = account.type === 'liability';
                 return (
                   <Card key={account.id}>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <div className="flex items-center gap-2">
                         {account.type === 'asset' && <Building2 className="h-4 w-4 text-muted-foreground" />}
                         {account.type === 'liability' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                         {account.type !== 'asset' && account.type !== 'liability' && <Banknote className="h-4 w-4 text-muted-foreground" />}
                         <CardTitle className="text-sm font-medium">
                           {account.name}
                         </CardTitle>
                       </div>
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

                       {isLiability && typeof account.statementBalance === 'number' && (
                         <div className="mt-2 text-xs text-muted-foreground">
                           Statement Balance: {(account.statementBalance / 100).toLocaleString("en-US", { style: "currency", currency: account.currency })}
                         </div>
                       )}

                        {isLiability && account.dueDate && (
                             <span className="text-xs text-muted-foreground">
                               Due: {new Date(account.dueDate).toLocaleDateString()}
                             </span>
                           )}
                     </CardContent>
                   </Card>
                 )
              })}
            </div>
          </div>
        )}

        {/* Upcoming Payments Section */}
        {upcomingPayments.length > 0 && (
          <div className="space-y-4">
             <UpcomingPayments transactions={upcomingPayments} />
          </div>
        )}

        {/* Bottom Grid: Recent Transactions & Budget */}
        {/* Bottom Grid: Recent Transactions & Budget */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
           {/* Recent Transactions */}
           <Card className="col-span-1 lg:col-span-4">
             <CardHeader>
               <div className="flex items-center gap-2">
                 <Receipt className="h-5 w-5 text-muted-foreground" />
                 <CardTitle>Recent Transactions</CardTitle>
               </div>
             </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentTransactions.map((transaction) => {
                  const isDeposit = transaction.entries.some(e => e.type === 'debit' && e.account.type === 'asset');
                  const isWithdrawal = transaction.entries.some(e => e.type === 'credit' && e.account.type === 'asset');
                  const isPositive = isDeposit && !isWithdrawal;

                   return (
                  <div key={transaction.id} className="flex items-center">
                    <div className="flex-shrink-0">
                      {isPositive ? (
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>
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
                )})}
                 {recentTransactions.length === 0 && (
                    <div className="text-center text-muted-foreground">
                        No recent transactions.
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

           {/* Budget Progress */}
           <Card className="col-span-1 lg:col-span-3">
             <CardHeader>
               <div className="flex items-center gap-2">
                 <Target className="h-5 w-5 text-muted-foreground" />
                 <CardTitle>Budget Progress</CardTitle>
               </div>
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
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                         <div className="h-full bg-primary" style={{ width: `${Math.min(budget.progress, 100)}%` }} />
                    </div>
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
    </div>
  );
}
