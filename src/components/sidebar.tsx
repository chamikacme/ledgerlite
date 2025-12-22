"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  ChevronsUpDown,
  LogOut,
  User,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/nextjs";


export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-screen w-64 flex-col border-r bg-gray-100/40 dark:bg-gray-800/40 lg:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/ledgerlite-logo.svg" alt="LedgerLite" width={32} height={32} className="h-8 w-8" />
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
              <Image src="/ledgerlite-logo.svg" alt="LedgerLite" width={32} height={32} className="h-8 w-8" />
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
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
      <SheetContent side="left" className="flex flex-col gap-0 p-0 w-[280px] sm:w-[320px]">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-semibold"
            onClick={() => setOpen(false)}
          >
            <Image src="/ledgerlite-logo.svg" alt="LedgerLite" width={32} height={32} className="h-8 w-8" />
            <span className="">LedgerLite</span>
          </Link>
        </div>
        <NavContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

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
    <div className="flex flex-col flex-1 min-h-0">
      <nav className="flex flex-col gap-1 px-2 py-4 text-sm font-medium lg:px-4 flex-1 overflow-y-auto">
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
      <div className="border-t p-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-auto p-2">
              <div className="flex items-center gap-3 w-full">
                 <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary shrink-0 border">
                    {user?.imageUrl ? (
                        <Image src={user.imageUrl} alt={user.fullName || "User"} width={32} height={32} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                            <User className="h-4 w-4" />
                        </div>
                    )}
                 </div>
                 
                 <div className="flex flex-col items-start overflow-hidden flex-1">
                    <span className="text-sm font-medium truncate w-full text-left">
                        {user?.fullName || user?.firstName || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                        {user?.primaryEmailAddress?.emailAddress}
                    </span>
                 </div>
                 
                 <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1 mb-2" align="start" side="top">
              <div className="flex flex-col gap-0.5">
                  <div className="px-2 py-1.5 text-sm font-semibold text-foreground/70">
                      My Account
                  </div>
                  <div className="h-px bg-border my-1" />
                  <Button variant="ghost" className="justify-start gap-2 px-2 h-8 font-normal" onClick={() => openUserProfile()}>
                       <User className="h-4 w-4 text-muted-foreground" />
                       <span>Profile</span>
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2 px-2 h-8 font-normal text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
                       <LogOut className="h-4 w-4" />
                       <span>Sign Out</span>
                  </Button>
              </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
