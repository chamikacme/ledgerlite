"use client";

import { useEffect, useState, useCallback } from "react";
import { getGoals } from "@/app/actions/goals";
import { getAccounts } from "@/app/actions/accounts";
import { GoalsList } from "@/components/goals-list";
import { CreateGoalDialog } from "@/components/create-goal-dialog";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { Goal, Account } from "@/types";

import { Skeleton } from "@/components/ui/skeleton";

export default function GoalsPage() {
  const { currency } = useCurrency();
  const [data, setData] = useState<{
    allGoals: Goal[];
    accounts: Account[];
  } | null>(null);

  const loadData = useCallback(async () => {
    const [allGoals, accounts] = await Promise.all([
      getGoals(),
      getAccounts(),
    ]);
    setData({ allGoals, accounts });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Separate active and completed goals
  const activeGoals = data.allGoals.filter(g => !g.completed);
  const completedGoals = data.allGoals.filter(g => g.completed);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Piggy Banks"
        action={<CreateGoalDialog onGoalCreated={loadData} />}
      />

      <GoalsList 
        activeGoals={activeGoals} 
        completedGoals={completedGoals} 
        accounts={data.accounts}
        currency={currency}
      />
    </div>
  );
}
