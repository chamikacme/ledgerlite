"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  PieChart,
  ArrowRightLeft,
  PiggyBank,
  BarChart3,
  Menu,
  ScrollText,
  RefreshCw,
  Settings,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-screen w-64 flex-col border-r bg-gray-100/40 dark:bg-gray-800/40 lg:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Wallet className="h-6 w-6" />
            <span className="">LedgerLite</span>
          </Link>
        </div>
        <NavContent />
      </div>

      {/* Mobile Sidebar - Controlled externally */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col p-0 w-[280px] sm:w-[320px]">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link 
              href="/" 
              className="flex items-center gap-2 font-semibold"
              onClick={() => setOpen(false)}
            >
              <Wallet className="h-6 w-6" />
              <span className="">LedgerLite</span>
            </Link>
          </div>
          <NavContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function MobileMenuButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0 w-[280px] sm:w-[320px]">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-semibold"
          >
            <Wallet className="h-6 w-6" />
            <span className="">LedgerLite</span>
          </Link>
        </div>
        <NavContent />
      </SheetContent>
    </Sheet>
  );
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/accounts", icon: CreditCard, label: "Accounts" },
    { href: "/transactions", icon: ArrowRightLeft, label: "Transactions" },
    { href: "/budgets", icon: PieChart, label: "Budgets" },
    { href: "/categories", icon: Wallet, label: "Categories" },
    { href: "/goals", icon: PiggyBank, label: "Piggy Banks" },
    { href: "/shortcuts", icon: Zap, label: "Shortcuts" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
    { href: "/journal", icon: ScrollText, label: "Journal" },
    { href: "/recurring", icon: RefreshCw, label: "Recurring" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="grid items-start gap-1 px-2 py-4 text-sm font-medium lg:px-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
