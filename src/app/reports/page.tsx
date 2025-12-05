import { getIncomeVsExpenseData, getSpendingByCategoryData } from "@/app/actions/reports";
import { IncomeExpenseChart, SpendingPieChart } from "@/components/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ReportsPage() {
  const incomeExpenseData = await getIncomeVsExpenseData();
  const spendingData = await getSpendingByCategoryData();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <IncomeExpenseChart data={incomeExpenseData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {spendingData.length > 0 ? (
                <SpendingPieChart data={spendingData} />
            ) : (
                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No spending data for this month.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
