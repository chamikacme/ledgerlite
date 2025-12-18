import { Suspense } from "react";
import { 
  getIncomeVsExpenseData, 
  getSpendingByCategoryData, 
  getIncomeByCategoryData,
  getAssetAllocationData,
  getNetWorthHistoryData
} from "@/app/actions/reports";
import { 
  IncomeExpenseChart, 
  SpendingPieChart, 
  GenericPieChart,
  NetWorthChart
} from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Reports" />

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<CardSkeleton title="Net Worth History" className="md:col-span-2" />}>
          <NetWorthReport />
        </Suspense>

        <Suspense fallback={<CardSkeleton title="Income vs Expense" />}>
          <IncomeExpenseReport />
        </Suspense>

        <Suspense fallback={<CardSkeleton title="Asset Allocation" />}>
          <AssetAllocationReport />
        </Suspense>

        <Suspense fallback={<CardSkeleton title="Spending by Category" />}>
          <SpendingByCategoryReport />
        </Suspense>

        <Suspense fallback={<CardSkeleton title="Income by Source" />}>
           <IncomeBySourceReport />
        </Suspense>
      </div>
    </div>
  );
}

async function NetWorthReport() {
    const data = await getNetWorthHistoryData();
    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Net Worth History (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <NetWorthChart data={data} />
            </CardContent>
        </Card>
    );
}

async function IncomeExpenseReport() {
    const data = await getIncomeVsExpenseData();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Income vs Expense (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <IncomeExpenseChart data={data} />
            </CardContent>
        </Card>
    );
}

async function AssetAllocationReport() {
    const data = await getAssetAllocationData();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <GenericPieChart data={data} />
                ) : (
                    <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                        No asset data available.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

async function SpendingByCategoryReport() {
    const data = await getSpendingByCategoryData();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending by Category (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <SpendingPieChart data={data} />
                ) : (
                    <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                        No spending data for this month.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

async function IncomeBySourceReport() {
    const data = await getIncomeByCategoryData();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Income by Source (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <GenericPieChart data={data} />
                ) : (
                    <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                        No income data for this month.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function CardSkeleton({ title, className }: { title: string, className?: string }) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[350px] w-full" />
            </CardContent>
        </Card>
    );
}
