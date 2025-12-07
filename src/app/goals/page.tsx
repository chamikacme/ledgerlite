"use client";

import { useEffect, useState, useCallback } from "react";
import { getGoals } from "@/app/actions/goals";
import { getAccounts } from "@/app/actions/accounts";
import { GoalsList } from "@/components/goals-list";
import { CreateGoalDialog } from "@/components/create-goal-dialog";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { Goal, Account } from "@/types";

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
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          Loading...
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
