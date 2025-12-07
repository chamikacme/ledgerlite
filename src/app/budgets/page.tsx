"use client";

import { useEffect, useState, useCallback } from "react";
import { getBudgets } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { BudgetsList } from "@/components/budgets-list";
import { CreateBudgetDialog } from "@/components/create-budget-dialog";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { BudgetWithProgress, Category } from "@/types";

export default function BudgetsPage() {
  const { currency } = useCurrency();
  const [data, setData] = useState<{
    budgets: BudgetWithProgress[];
    categories: Category[];
  } | null>(null);

  const loadData = useCallback(async () => {
    const [budgets, categories] = await Promise.all([
      getBudgets(),
      getCategories(),
    ]);
    setData({ budgets, categories });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        action={
          <CreateBudgetDialog 
            categories={data.categories} 
            onBudgetCreated={loadData}
          />
        }
      />

      <BudgetsList 
        budgets={data.budgets} 
        categories={data.categories}
        currency={currency}
      />
    </div>
  );
}
