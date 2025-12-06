"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ReactNode, useState } from "react";

interface FloatingActionButtonProps {
  children: ReactNode;
}

export function FloatingActionButton({ children }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg lg:hidden z-50 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Quick transaction</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <div className="h-full overflow-y-auto p-6">
          <SheetHeader className="mb-6">
            <SheetTitle>Quick Transaction</SheetTitle>
            <SheetDescription>
              Select a shortcut or create a new transaction
            </SheetDescription>
          </SheetHeader>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
