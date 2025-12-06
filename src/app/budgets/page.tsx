import { getBudgets } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getUserSettings } from "@/app/actions/accounts";
import { BudgetsList } from "@/components/budgets-list";
import { CreateBudgetDialog } from "@/components/create-budget-dialog";
import { PageHeader } from "@/components/page-header";

export default async function BudgetsPage() {
  const budgets = await getBudgets();
  const categories = await getCategories();
  const settings = await getUserSettings();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Budgets"
        action={<CreateBudgetDialog categories={categories} />}
      />

      <BudgetsList 
        budgets={budgets} 
        categories={categories}
        currency={settings?.currency || "LKR"}
      />
    </div>
  );
}
