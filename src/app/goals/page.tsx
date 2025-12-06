import { getGoals } from "@/app/actions/goals";
import { getAccounts, getUserSettings } from "@/app/actions/accounts";
import { GoalsList } from "@/components/goals-list";
import { CreateGoalDialog } from "@/components/create-goal-dialog";
import { PageHeader } from "@/components/page-header";

export default async function GoalsPage() {
  const allGoals = await getGoals();
  const accounts = await getAccounts();
  const settings = await getUserSettings();

  // Separate active and completed goals
  const activeGoals = allGoals.filter(g => !g.completed);
  const completedGoals = allGoals.filter(g => g.completed);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Piggy Banks"
        action={<CreateGoalDialog />}
      />

      <GoalsList 
        activeGoals={activeGoals} 
        completedGoals={completedGoals} 
        accounts={accounts}
        currency={settings?.currency || "LKR"}
      />
    </div>
  );
}
