import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" /> {/* Search */}
        </div>
        <div className="border rounded-md">
          <div className="h-12 border-b bg-muted/50 px-4 flex items-center">
             <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b px-4 flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
