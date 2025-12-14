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

interface MobileActionBarProps {
  children: ReactNode;
}

export function MobileActionBar({ children }: MobileActionBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full border-t bg-background/80 backdrop-blur-xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="h-12 w-full rounded-xl text-base font-medium shadow-sm">
            <Plus className="mr-2 h-5 w-5" />
            Quick Transaction
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0">
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
    </div>
  );
}
