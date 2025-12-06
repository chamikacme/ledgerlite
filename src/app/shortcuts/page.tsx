"use client";

import { useEffect, useState } from "react";
import { getShortcuts } from "@/app/actions/shortcuts";
import { getAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import { PageHeader } from "@/components/page-header";
import { ShortcutsList } from "@/components/shortcuts-list";
import { CreateShortcutDialog } from "@/components/create-shortcut-dialog";

export default function ShortcutsPage() {
  const [data, setData] = useState<{
    shortcuts: any[];
    accounts: any[];
    categories: any[];
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
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          Loading...
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
