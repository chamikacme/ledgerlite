"use client";

import { useCurrency } from "@/contexts/currency-context";
import type { JournalEntry } from "@/types";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface JournalListProps {
    entries: JournalEntry[];
    meta: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    }
    search: string;
    from?: Date;
    to?: Date;
    sortBy: string;
    sortOrder: "asc" | "desc";
    isLoading?: boolean;
}

export function JournalList({ entries, meta, search, from, to, sortBy, sortOrder, isLoading }: JournalListProps) {
  const { currency } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const handleDateChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (range?.from) params.set("from", range.from.toISOString());
    else params.delete("from");
    
    if (range?.to) params.set("to", range.to.toISOString());
    else params.delete("to");
    
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortingChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    let newSorting: SortingState;
    if (typeof updaterOrValue === 'function') {
        const currentSort: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [];
        newSorting = updaterOrValue(currentSort);
    } else {
        newSorting = updaterOrValue;
    }
    
    const params = new URLSearchParams(searchParams);
    if (newSorting.length > 0) {
        params.set("sortBy", newSorting[0].id);
        params.set("sortOrder", newSorting[0].desc ? "desc" : "asc");
    } else {
        params.delete("sortBy");
        params.delete("sortOrder"); // Default
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newPageSize.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
        searchValue={search}
        onSearch={handleSearch}
        sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
        onSortingChange={handleSortingChange}
        isLoading={isLoading}
        filterSlot={
            <DatePickerWithRange 
                date={{ from, to }}
                setDate={handleDateChange}
            />
        }
      />
  );
}
