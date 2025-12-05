import { getGoals } from "@/app/actions/goals";
import { getAccounts } from "@/app/actions/accounts";
import { GoalForm } from "@/components/goal-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ContributeToGoal } from "@/components/contribute-to-goal";
import { WithdrawGoal } from "@/components/withdraw-goal";
import { Plus, PiggyBank, Trophy } from "lucide-react";

export default async function GoalsPage() {
  const allGoals = await getGoals();
  const accounts = await getAccounts();

  // Separate active and completed goals
  const activeGoals = allGoals.filter(g => !g.completed);
  const completedGoals = allGoals.filter(g => g.completed);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Piggy Banks</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
              <DialogDescription>
                Set a target for something you want to buy.
              </DialogDescription>
            </DialogHeader>
            <GoalForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Active Goals</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeGoals.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            
            return (
              <Card key={goal.id} className={isCompleted ? "border-green-500 border-2" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {goal.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isCompleted && <Trophy className="h-4 w-4 text-green-500" />}
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {isCompleted && (
                    <div className="mb-3 px-3 py-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
                      <p className="text-xs font-medium text-green-700 dark:text-green-300 text-center">
                        🎉 Goal Achieved!
                      </p>
                    </div>
                  )}
                  <div className="text-2xl font-bold">
                    {(goal.currentAmount / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    of {(goal.targetAmount / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </p>
                  <Progress value={progress} className={`h-2 ${isCompleted ? 'bg-green-200' : ''}`} />
                  <p className="text-xs text-right mt-1 text-muted-foreground">{Math.round(progress)}%</p>
                  
                  {isCompleted ? (
                    <WithdrawGoal 
                      goalId={goal.id} 
                      goalName={goal.name}
                      goalAmount={goal.currentAmount}
                      accounts={accounts}
                    />
                  ) : (
                    <ContributeToGoal goalId={goal.id} goalName={goal.name} accounts={accounts} />
                  )}
                </CardContent>
              </Card>
            );
          })}
          {activeGoals.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No active goals. Create one to start saving!
            </div>
          )}
        </div>
      </div>

      {/* Completed Goals Section */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Completed Goals
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="opacity-75 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium line-through decoration-green-500">
                    {goal.name}
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 text-center">
                      ✅ Completed & Withdrawn
                    </p>
                    <p className="text-xs text-center text-green-600 dark:text-green-400 mt-1">
                      Goal: {(goal.targetAmount / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
