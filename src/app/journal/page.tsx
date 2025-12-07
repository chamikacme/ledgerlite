"use client";

import { useEffect, useState } from "react";
import { getJournalEntries } from "@/app/actions/journal";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { JournalEntry } from "@/types";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

export default function JournalPage() {
  const { currency } = useCurrency();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      const data = await getJournalEntries();
      setEntries(data);
      setIsLoading(false);
    }
    loadEntries();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          Loading...
        </div>
      </div>
    );
  }

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
      
      <DataTable columns={columns} data={entries} searchKey="description" />
    </div>
  );
}
