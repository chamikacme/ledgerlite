"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { executeRecurringTransaction, skipRecurringTransaction } from "@/app/actions/recurring";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Calendar, PlayCircle, SkipForward } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useState } from "react";

interface RecurringTransaction {
  id: number;
  description: string;
  amount: number;
  frequency: string;
  nextRunDate: Date;
  isDueToday: boolean;
  isDueSoon: boolean;
  isOverdue: boolean;
}

export function UpcomingPayments({ transactions }: { transactions: RecurringTransaction[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);

  async function handleExecute(id: number) {
    setLoading(id);
    try {
      await executeRecurringTransaction(id);
      toast.success("Transaction executed successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to execute transaction");
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
      toast.error("Failed to skip transaction");
    } finally {
      setLoading(null);
    }
  }

  if (transactions.length === 0) {
    return null;
  }

  // Filter to only show payments due within 7 days
  const within7Days = transactions.filter(tx => {
    const now = new Date();
    const nextDate = new Date(tx.nextRunDate);
    const daysUntil = differenceInDays(nextDate, now);
    return daysUntil <= 7; // Include overdue (negative days) and up to 7 days ahead
  });

  // If no payments within 7 days, don't show the section
  if (within7Days.length === 0) {
    return null;
  }

  // Show max 5 upcoming
  const upcomingLimit = within7Days.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Payments (Next 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingLimit.map((tx) => (
          <div
            key={tx.id}
            className={`p-3 rounded-lg border ${
              tx.isDueToday
                ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                : tx.isDueSoon
                ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {tx.isDueToday && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded">
                      DUE TODAY
                    </span>
                  )}
                  {tx.isDueSoon && !tx.isDueToday && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500 text-white rounded">
                      DUE SOON
                    </span>
                  )}
                  <h4 className="font-medium text-sm">{tx.description}</h4>
                </div>
                <p className="text-lg font-bold mt-1">
                  {(tx.amount / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {format(new Date(tx.nextRunDate), "MMM d, yyyy")} ({tx.frequency})
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleExecute(tx.id)}
                  disabled={loading === tx.id}
                  className="text-xs"
                >
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Execute
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSkip(tx.id)}
                  disabled={loading === tx.id}
                  className="text-xs"
                >
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
