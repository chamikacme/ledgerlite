"use client";

import { useEffect, useState } from "react";
import { getJournalEntries } from "@/app/actions/journal";
import { PageHeader } from "@/components/page-header";
import { useCurrency } from "@/contexts/currency-context";
import type { JournalEntry } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Journal (Audit Log)" />
      
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{format(entry.date, "PPP")}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.accountName}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {entry.type === "debit"
                    ? (entry.amount / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: currency,
                      })
                    : ""}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {entry.type === "credit"
                    ? (entry.amount / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: currency,
                      })
                    : ""}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No journal entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
