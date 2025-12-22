"use client";

import { useEffect, useState, useCallback } from "react";
import { getPaginatedAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { AccountsList } from "@/components/accounts-list";
import { CreateAccountDialog } from "@/components/create-account-dialog";
import { PageHeader } from "@/components/page-header";
import { useSearchParams } from "next/navigation";
import type { Account, Category } from "@/types";
import { toast } from "sonner";

export default function AccountsPage() {
  const searchParams = useSearchParams();
  
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "updatedAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const [data, setData] = useState<{
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accountsData, categories] = await Promise.all([
        getPaginatedAccounts(page, pageSize, search, sortBy, sortOrder),
        getCategories(),
      ]);
      setData({ 
        accounts: accountsData.data, 
        categories, 
        meta: accountsData.meta 
      });
    } catch (error) {
      toast.error("Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts and credit cards"
        action={<CreateAccountDialog categories={data?.categories || []} onAccountCreated={loadData} />}
      />

      <AccountsList 
        accounts={data?.accounts || []} 
        categories={data?.categories || []} 
        meta={data?.meta || { page, pageSize, totalCount: 0, totalPages: 1 }}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        isLoading={isLoading}
        onRefresh={loadData}
      />
    </div>
  );
}
