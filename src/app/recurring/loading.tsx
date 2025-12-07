import { Skeleton } from "@/components/ui/skeleton";

export default function RecurringLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="border rounded-md">
        <div className="h-12 border-b bg-muted/50 px-4 flex items-center">
            <Skeleton className="h-4 w-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-b px-4 flex items-center gap-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
