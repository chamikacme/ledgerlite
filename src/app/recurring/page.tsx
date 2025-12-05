import { getRecurringTransactions } from "@/app/actions/recurring";
import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { RecurringPageClient } from "@/components/recurring-page-client";

export default async function RecurringPage() {
  const recurringTransactions = await getRecurringTransactions();
  const accounts = await getAccounts();
  const categories = await getCategories();

  return (
    <RecurringPageClient
      recurringTransactions={recurringTransactions}
      accounts={accounts}
      categories={categories}
    />
  );
}
