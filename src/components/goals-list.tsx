"use client";

import { deleteGoal } from "@/app/actions/goals";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ContributeToGoal } from "@/components/contribute-to-goal";
import { WithdrawGoal } from "@/components/withdraw-goal";
import { EditGoalDialog } from "@/components/edit-goal-dialog";
import { Edit, Trophy, PiggyBank, Trash } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  completed: boolean;
  accountId: number | null;
}

interface GoalsListProps {
  activeGoals: Goal[];
  completedGoals: Goal[];
  accounts: Account[];
  currency: string;
  onUpdate?: () => void;
}

export function GoalsList({ activeGoals, completedGoals, accounts, currency, onUpdate }: GoalsListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteGoal(id);
      toast.success("Goal deleted");
      if (onUpdate) onUpdate();
      setDeletingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete goal");
      setDeletingId(null);
    }
  };

  const editingGoal = activeGoals.find(g => g.id === editingId);

  return (
    <>
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(goal.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingId(goal.id)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
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
                      currency: currency,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    of {(goal.targetAmount / 100).toLocaleString("en-US", { style: "currency", currency: currency })}
                  </p>
                  <Progress value={progress} className={`h-2 ${isCompleted ? 'bg-green-200' : ''}`} />
                  <p className="text-xs text-right mt-1 text-muted-foreground">{Math.round(progress)}%</p>
                  
                  {isCompleted ? (
                    <WithdrawGoal 
                      goalId={goal.id} 
                      goalName={goal.name}
                      goalAmount={goal.currentAmount}
                      accounts={accounts}
                      onUpdate={onUpdate}
                    />
                  ) : (
                    <ContributeToGoal 
                        goalId={goal.id} 
                        goalName={goal.name} 
                        accounts={accounts} 
                        onUpdate={onUpdate}
                    />
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
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-green-500" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingId(goal.id)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 text-center">
                      ✅ Completed & Withdrawn
                    </p>
                    <p className="text-xs text-center text-green-600 dark:text-green-400 mt-1">
                      Goal: {(goal.targetAmount / 100).toLocaleString("en-US", { style: "currency", currency: currency })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {editingGoal && (
        <EditGoalDialog
          goal={editingGoal}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the goal and its history.
              Active goals must be empty before they can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => deletingId && handleDelete(deletingId)}
                className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
