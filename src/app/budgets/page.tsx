"use client";

import { useEffect, useState } from "react";
import { getBudgets } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { BudgetsList } from "@/components/budgets-list";
import { CreateBudgetDialog } from "@/components/create-budget-dialog";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";

export default function BudgetsPage() {
  const { currency } = useCurrency();
  const [data, setData] = useState<{
    budgets: any[];
    categories: any[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      const [budgets, categories] = await Promise.all([
        getBudgets(),
        getCategories(),
      ]);
      setData({ budgets, categories });
    }
    loadData();
  }, []);

  if (!data) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Budgets"
        action={<CreateBudgetDialog categories={data.categories} />}
      />

      <BudgetsList 
        budgets={data.budgets} 
        categories={data.categories}
        currency={currency}
      />
    </div>
  );
}
