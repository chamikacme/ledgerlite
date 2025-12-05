import { getBudgets } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { BudgetForm } from "@/components/budget-form";
import { BudgetsList } from "@/components/budgets-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default async function BudgetsPage() {
  const budgets = await getBudgets();
  const categories = await getCategories();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Monthly Budget</DialogTitle>
              <DialogDescription>
                Set a spending limit for a category.
              </DialogDescription>
            </DialogHeader>
            <BudgetForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <BudgetsList budgets={budgets} categories={categories} />
    </div>
  );
}
