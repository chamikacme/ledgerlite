"use client";

import { useEffect, useState, useCallback } from "react";
import { getJournalEntries } from "@/app/actions/journal";
import { PageHeader } from "@/components/page-header";
import { JournalList } from "@/components/journal-list";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { JournalEntry } from "@/types";

export default function JournalPage() {
  const searchParams = useSearchParams();
  
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const search = searchParams.get("search") || "";
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
  const sortBy = searchParams.get("sortBy") || "date";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const [data, setData] = useState<{
    entries: JournalEntry[];
    meta: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: entries, meta } = await getJournalEntries(
        page,
        pageSize,
        search,
        from,
        to,
        sortBy,
        sortOrder
      );
      setData({ entries, meta });
    } catch (error) {
      toast.error("Failed to load journal entries");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, from?.toISOString(), to?.toISOString(), sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Journal (Audit Log)" />
      
      <JournalList 
        entries={data?.entries || []}
        meta={data?.meta || { page, pageSize, totalCount: 0, totalPages: 1 }}
        search={search}
        from={from}
        to={to}
        sortBy={sortBy}
        sortOrder={sortOrder}
        isLoading={isLoading}
      />
    </div>
  );
}

