"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditCategoryDialog } from "@/components/edit-category-dialog";
import { Edit } from "lucide-react";

interface Category {
  id: number;
  name: string;
  type: string | null;
}

export function CategoriesList({ categories }: { categories: Category[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const editingCategory = categories.find(c => c.id === editingId);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {category.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase">
                  {category.type}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(category.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No categories found.
          </div>
        )}
      </div>

      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </>
  );
}
