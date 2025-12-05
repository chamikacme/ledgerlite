import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { getTransactions } from "@/app/actions/transactions";
import { TransactionForm } from "@/components/transaction-form";
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
import { format } from "date-fns";

export default async function TransactionsPage() {
  const accounts = await getAccounts();
  const categories = await getCategories();
  const transactions = await getTransactions();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>
                Record a new transaction.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm accounts={accounts} categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {format(transaction.date, "PPP")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {(transaction.amount / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD", // TODO: Use user currency
                  })}
                </p>
                {transaction.category && (
                  <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                    {transaction.category.name}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {transactions.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                No transactions found.
            </div>
        )}
      </div>
    </div>
  );
}
