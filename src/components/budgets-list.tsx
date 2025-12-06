"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EditBudgetDialog } from "@/components/edit-budget-dialog";
import { Edit } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Budget {
  id: number;
  categoryId: number;
  amount: number;
  period: string;
  spent: number;
  remaining: number;
  progress: number;
  category: {
    name: string;
  };
}

interface BudgetsListProps {
  budgets: Budget[];
  categories: Category[];
  currency: string;
}

export function BudgetsList({ budgets, categories, currency }: BudgetsListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const editingBudget = budgets.find(b => b.id === editingId);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <Card key={budget.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {budget.category.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground capitalize">
                  {budget.period}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(budget.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(budget.amount / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: currency,
                })}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Spent: {(budget.spent / 100).toLocaleString("en-US", { style: "currency", currency: currency })}</span>
                  <span className={budget.remaining < 0 ? "text-red-500 font-bold" : ""}>
                    Remaining: {(budget.remaining / 100).toLocaleString("en-US", { style: "currency", currency: currency })}
                  </span>
                </div>
                <Progress 
                  value={budget.progress} 
                  className={budget.progress > 100 ? "bg-red-100 [&>div]:bg-red-500" : ""} 
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {budgets.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No budgets set.
          </div>
        )}
      </div>

      {editingBudget && (
        <EditBudgetDialog
          budget={editingBudget}
          categories={categories}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </>
  );
}
