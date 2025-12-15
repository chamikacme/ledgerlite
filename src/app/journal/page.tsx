"use client";

import { useEffect, useState } from "react";
import { getJournalEntries } from "@/app/actions/journal";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { JournalEntry } from "@/types";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function JournalPage() {
  const { currency } = useCurrency();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;

  const [data, setData] = useState<{
      data: JournalEntry[],
      meta: {
          page: number;
          pageSize: number;
          totalCount: number;
          totalPages: number;
      }
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      setIsLoading(true);
      const result = await getJournalEntries(page, pageSize);
      setData(result);
      setIsLoading(false);
    }
    loadEntries();
  }, [page, pageSize]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newPageSize.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isLoading || !data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
        </div>

        <div className="border rounded-md">
          <div className="h-12 border-b bg-muted/50 px-4 flex items-center">
             <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 border-b px-4 flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { data: entries, meta } = data;

  const columns: ColumnDef<JournalEntry>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="whitespace-nowrap">{format(row.getValue("date"), "PPP")}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "accountName",
      header: "Account",
    },
    {
       id: "debit",
       header: "Debit",
       cell: ({ row }) => {
          const entry = row.original;
          return entry.type === "debit" ? (
             <div className="text-right whitespace-nowrap">
                {(entry.amount / 100).toLocaleString("en-US", {
                   style: "currency",
                   currency: currency,
                })}
             </div>
          ) : null;
       }
    },
    {
       id: "credit",
       header: "Credit",
       cell: ({ row }) => {
          const entry = row.original;
          return entry.type === "credit" ? (
             <div className="text-right whitespace-nowrap">
                {(entry.amount / 100).toLocaleString("en-US", {
                   style: "currency",
                   currency: currency,
                })}
             </div>
          ) : null;
       }
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Journal (Audit Log)" />
      
      <DataTable 
        columns={columns} 
        data={entries} 
        searchKey="description" 
        disablePagination={false}
        pageCount={meta.totalPages}
        page={meta.page}
        onPageChange={handlePageChange}
        pageSize={meta.pageSize}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
