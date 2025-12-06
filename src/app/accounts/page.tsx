import { getAccounts } from "@/app/actions/accounts";
import { getGoals } from "@/app/actions/goals";
import { getCategories } from "@/app/actions/categories";
import { AccountsList } from "@/components/accounts-list";
import { CreateAccountDialog } from "@/components/create-account-dialog";
import { PageHeader } from "@/components/page-header";

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
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts and credit cards"
        action={<CreateAccountDialog categories={categories} />}
      />

      <AccountsList accounts={accounts} categories={categories} />
    </div>
  );
}
