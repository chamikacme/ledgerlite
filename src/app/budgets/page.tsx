"use client";

import { useEffect, useState } from "react";
import { getBudgets } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { BudgetsList } from "@/components/budgets-list";
import { CreateBudgetDialog } from "@/components/create-budget-dialog";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { BudgetWithProgress, Category } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetsPage() {
  const { currency } = useCurrency();
  const [data, setData] = useState<{
    budgets: BudgetWithProgress[];
    categories: Category[];
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [budgets, categories] = await Promise.all([
        getBudgets(),
        getCategories(),
      ]);
      setData({ budgets, categories });
    };
    loadData();
  }, []);

  const loadData = async () => {
    const [budgets, categories] = await Promise.all([
      getBudgets(),
      getCategories(),
    ]);
    setData({ budgets, categories });
  };

  if (!data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
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
