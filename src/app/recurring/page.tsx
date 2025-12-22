"use client";

import { useEffect, useState } from "react";
import { getRecurringTransactions } from "@/app/actions/recurring";
import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { RecurringPageClient } from "@/components/recurring-page-client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { Account, Category, RecurringTransaction } from "@/types";

export default function RecurringPage() {
  const searchParams = useSearchParams();
  
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const [data, setData] = useState<{
    recurringTransactions: RecurringTransaction[];
    accounts: Account[];
    categories: Category[];
    meta: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recurringData, accounts, categories] = await Promise.all([
        getRecurringTransactions(page, pageSize, search, sortBy, sortOrder),
        getAccounts(),
        getCategories(),
      ]);
      setData({ 
        recurringTransactions: recurringData.data, 
        accounts, 
        categories, 
        meta: recurringData.meta 
      });
    } catch (error) {
      toast.error("Failed to load recurring transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, search, sortBy, sortOrder]);

  return (
    <RecurringPageClient
      recurringTransactions={data?.recurringTransactions || []}
      accounts={data?.accounts || []}
      categories={data?.categories || []}
      meta={data?.meta || { page, pageSize, totalCount: 0, totalPages: 1 }}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
      isLoading={isLoading}
      onRefresh={loadData}
    />
  );
}
