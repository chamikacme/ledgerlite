"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ArrowRight, Zap } from "lucide-react";
import { deleteShortcut } from "@/app/actions/shortcuts";
import { EditShortcutDialog } from "@/components/edit-shortcut-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Account, Category, ShortcutWithRelations } from "@/types";

interface ShortcutsListProps {
  shortcuts: ShortcutWithRelations[];
  accounts: Account[];
  categories: Category[];
}

export function ShortcutsList({ shortcuts, accounts, categories }: ShortcutsListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const router = useRouter();

  const editingShortcut = shortcuts.find(s => s.id === editingId);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this shortcut?")) return;

    try {
      await deleteShortcut(id);
      toast.success("Shortcut deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete shortcut");
    }
  }

  if (shortcuts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-10">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No shortcuts yet</p>
            <p className="text-sm">Create your first shortcut to quickly create frequent transactions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((shortcut) => (
          <Card key={shortcut.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-3xl">{shortcut.icon || "⚡"}</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{shortcut.name}</CardTitle>
                    {shortcut.description && (
                      <CardDescription className="text-xs mt-1 line-clamp-1">
                        {shortcut.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditingId(shortcut.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(shortcut.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="truncate">{shortcut.fromAccount.name}</span>
                  <ArrowRight className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{shortcut.toAccount.name}</span>
                </div>
                {shortcut.category && (
                  <div className="text-xs">
                    Category: <span className="font-medium">{shortcut.category.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingShortcut && (
        <EditShortcutDialog
          shortcut={editingShortcut}
          accounts={accounts}
          categories={categories}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </>
  );
}
