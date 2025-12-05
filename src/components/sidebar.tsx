"use client";

import Link from "next/link";
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
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Sidebar() {
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

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Wallet className="h-6 w-6" />
              <span className="">LedgerLite</span>
            </Link>
          </div>
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  );
}

function NavContent() {
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
      <Link
        href="/accounts"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <CreditCard className="h-4 w-4" />
        Accounts
      </Link>
      <Link
        href="/transactions"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <ArrowRightLeft className="h-4 w-4" />
        Transactions
      </Link>
      <Link
        href="/budgets"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <PieChart className="h-4 w-4" />
        Budgets
      </Link>
      <Link
        href="/categories"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <Wallet className="h-4 w-4" />
        Categories
      </Link>
      <Link
        href="/goals"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <PiggyBank className="h-4 w-4" />
        Piggy Banks
      </Link>
      <Link
        href="/reports"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <BarChart3 className="h-4 w-4" />
        Reports
      </Link>
      <Link
        href="/journal"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <ScrollText className="h-4 w-4" />
        Journal
      </Link>
      <Link
        href="/recurring"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <RefreshCw className="h-4 w-4" />
        Recurring
      </Link>
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </nav>
  );
}
