"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/responsive-dialog";
import { RecurringTransactionForm } from "@/components/recurring-form";
import { EditRecurringDialog } from "@/components/edit-recurring-dialog";
import {
  deleteRecurringTransaction,
  toggleRecurringTransaction,
  executeRecurringTransaction,
  skipRecurringTransaction,
} from "@/app/actions/recurring";
import { Plus, PlayCircle, SkipForward, Edit, Pause, Play, Trash2, Calendar, Infinity } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, isPast, differenceInDays } from "date-fns";

interface Account {
  id: number;
  name: string;
  type: string;
}

interface Category {
  id: number;
  name: string;
}

interface RecurringTransaction {
  id: number;
  description: string;
  amount: number;
  categoryId: number | null;
  type: string;
  fromAccountId: number | null;
  toAccountId: number | null;
  frequency: string;
  nextRunDate: Date;
  lastRunDate: Date | null;
  active: boolean;
  totalOccurrences: number | null;
  completedOccurrences: number;
}

function getStatusInfo(rt: RecurringTransaction) {
  const now = new Date();
  const nextDate = new Date(rt.nextRunDate);
  const daysUntil = differenceInDays(nextDate, now);
  
  if (!rt.active) {
    const isCompleted = rt.totalOccurrences && rt.completedOccurrences >= rt.totalOccurrences;
    return {
      badge: isCompleted ? "✅ Completed" : "⏸️ Paused",
      color: isCompleted ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
  }
  
  if (isPast(nextDate)) {
    return {
      badge: "🔴 Overdue",
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
  }
  
  if (daysUntil <= 7) {
    return {
      badge: "🟡 Due Soon",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
  }
  
  return {
    badge: "🟢 Active",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };
}

export function RecurringPageClient({
  recurringTransactions,
  accounts,
  categories,
}: {
  recurringTransactions: RecurringTransaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creationOpen, setCreationOpen] = useState(false);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this recurring transaction?")) return;
    
    setLoading(id);
    try {
      await deleteRecurringTransaction(id);
      toast.success("Recurring transaction deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    } finally {
      setLoading(null);
    }
  }

  async function handleToggle(id: number) {
    setLoading(id);
    try {
      await toggleRecurringTransaction(id);
      toast.success("Status updated");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
    }
  }

  async function handleExecute(id: number) {
    setLoading(id);
    try {
      await executeRecurringTransaction(id);
      toast.success("Transaction executed");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to execute");
    } finally {
      setLoading(null);
    }
  }

  async function handleSkip(id: number) {
    setLoading(id);
    try {
      await skipRecurringTransaction(id);
      toast.success("Transaction skipped");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to skip");
    } finally {
      setLoading(null);
    }
  }

  const editingTransaction = recurringTransactions.find(rt => rt.id === editingId);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Recurring Transactions"
        action={
          <ResponsiveDialog open={creationOpen} onOpenChange={setCreationOpen}>
            <ResponsiveDialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Recurring Transaction
              </Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Create Recurring Transaction</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  Set up automated recurring payments or income.
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <RecurringTransactionForm 
                accounts={accounts} 
                categories={categories} 
                onSuccess={() => setCreationOpen(false)}
              />
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recurringTransactions.map((rt) => {
          const status = getStatusInfo(rt);
          const progress = rt.totalOccurrences 
            ? `${rt.completedOccurrences}/${rt.totalOccurrences}`
            : "∞ Infinite";

          return (
            <Card key={rt.id} className={!rt.active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{rt.description}</CardTitle>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${status.color}`}>
                    {status.badge}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">
                  {(rt.amount / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: "LKR",
                  })}
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span className="capitalize">{rt.frequency}</span>
                  </div>
                  <div>
                    <strong>Next:</strong> {format(new Date(rt.nextRunDate), "MMM d, yyyy")}
                  </div>
                  {rt.lastRunDate && (
                    <div>
                      <strong>Last:</strong> {format(new Date(rt.lastRunDate), "MMM d, yyyy")}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {rt.totalOccurrences ? (
                      <>
                        <strong>Progress:</strong> {progress}
                      </>
                    ) : (
                      <>
                        <Infinity className="h-3 w-3" />
                        <span>Infinite ({rt.completedOccurrences} completed)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleExecute(rt.id)}
                    disabled={!rt.active || loading === rt.id}
                    className="text-xs"
                  >
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSkip(rt.id)}
                    disabled={!rt.active || loading === rt.id}
                    className="text-xs"
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(rt.id)}
                    disabled={loading === rt.id}
                    className="text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(rt.id)}
                    disabled={loading === rt.id}
                    className="text-xs"
                  >
                    {rt.active ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Resume
                      </>
                    )}
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(rt.id)}
                  disabled={loading === rt.id}
                  className="w-full text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {recurringTransactions.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No recurring transactions set up.
          </div>
        )}
      </div>

      {editingTransaction && (
        <EditRecurringDialog
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </div>
  );
}
