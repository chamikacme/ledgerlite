"use client";

import { useEffect, useState } from "react";
import { FloatingActionButton } from "@/components/floating-action-button";
import { QuickTransaction } from "@/components/quick-transaction";
import { getShortcuts } from "@/app/actions/shortcuts";
import type { ShortcutWithRelations } from "@/types";

export function QuickTransactionFab() {
  const [shortcuts, setShortcuts] = useState<ShortcutWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadShortcuts() {
    try {
      setLoading(true);
      const data = await getShortcuts();
      console.log("Loaded shortcuts:", data); // Debug log
      setShortcuts(data);
    } catch (error) {
      console.error("Failed to load shortcuts:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShortcuts();
  }, []);

  return (
    <FloatingActionButton>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-muted-foreground">Loading shortcuts...</p>
        </div>
      ) : (
        <QuickTransaction 
          shortcuts={shortcuts} 
          onSuccess={() => {
            loadShortcuts(); // Reload shortcuts after creating a transaction
          }} 
        />
      )}
    </FloatingActionButton>
  );
}
