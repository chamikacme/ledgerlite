"use client";

import { useEffect, useState } from "react";
import { getShortcuts } from "@/app/actions/shortcuts";
import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { PageHeader } from "@/components/page-header";
import { ShortcutsList } from "@/components/shortcuts-list";
import { CreateShortcutDialog } from "@/components/create-shortcut-dialog";
import type { ShortcutWithRelations, Account, Category } from "@/types";

import { Skeleton } from "@/components/ui/skeleton";

export default function ShortcutsPage() {
  const [data, setData] = useState<{
    shortcuts: ShortcutWithRelations[];
    accounts: Account[];
    categories: Category[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      const [shortcuts, accounts, categories] = await Promise.all([
        getShortcuts(),
        getAccounts(),
        getCategories(),
      ]);
      setData({ shortcuts, accounts, categories });
    }
    loadData();
  }, []);

  if (!data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 pb-3 space-y-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Transaction Shortcuts"
        description="Create quick shortcuts for frequent transactions"
        action={<CreateShortcutDialog accounts={data.accounts} categories={data.categories} />}
      />

      <ShortcutsList
        shortcuts={data.shortcuts}
        accounts={data.accounts}
        categories={data.categories}
      />
    </div>
  );
}
