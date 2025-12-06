import { getAccounts, getUserSettings } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { getTransactions } from "@/app/actions/transactions";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { format } from "date-fns";

export default async function TransactionsPage() {
  const accounts = await getAccounts();
  const categories = await getCategories();
  const transactions = await getTransactions();
  const settings = await getUserSettings();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Transactions"
        action={<CreateTransactionDialog accounts={accounts} categories={categories} />}
      />

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {format(transaction.date, "PPP")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold whitespace-nowrap">
                  {(transaction.amount / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: settings?.currency || "LKR",
                  })}
                </p>
                {transaction.category && (
                  <span className="text-xs bg-secondary px-2 py-1 rounded-full inline-block mt-1">
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
