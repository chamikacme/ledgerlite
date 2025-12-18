import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
         <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Net Worth - Full Width */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-64" /></CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>

        {/* 4 Smaller Cards */}
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
