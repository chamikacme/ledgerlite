"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GeneralSettings } from "@/components/settings/general-settings";
import { DashboardSettings } from "@/components/settings/dashboard-settings";
import { DataManagement } from "@/components/data-management";
import { Account } from "@/types";
import { Settings, LayoutDashboard, Database } from "lucide-react";

interface SettingsShellProps {
  defaultSettings: {
    currency: string;
    showNetWorth: boolean;
    showMonthlySpending: boolean;
    showDefinedNetWorth: boolean;
    definedNetWorthIncludes: number[];
  };
  accounts: Account[];
}

export function SettingsShell({ defaultSettings, accounts }: SettingsShellProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "general";

  return (
    <Tabs defaultValue={defaultTab} orientation="vertical" className="flex flex-col lg:flex-row gap-8 w-full">
      <aside className="lg:w-1/5 xl:w-1/6">
        <TabsList className="flex flex-row lg:flex-col w-full h-auto gap-2 bg-transparent p-0 justify-start overflow-x-auto lg:overflow-visible">
             <TabsTrigger 
                value="general" 
                className="w-full justify-start gap-2 px-3 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md transition-colors hover:bg-muted"
             >
                <Settings className="h-4 w-4" />
                General
             </TabsTrigger>
             <TabsTrigger 
                value="dashboard" 
                className="w-full justify-start gap-2 px-3 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md transition-colors hover:bg-muted"
             >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
             </TabsTrigger>
             <TabsTrigger 
                value="data" 
                className="w-full justify-start gap-2 px-3 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md transition-colors hover:bg-muted"
             >
                <Database className="h-4 w-4" />
                Data
             </TabsTrigger>
        </TabsList>
      </aside>
      <div className="flex-1 lg:max-w-4xl">
        <TabsContent value="general" className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4">
                 <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
                 <p className="text-muted-foreground">Manage your global application preferences.</p>
            </div>
            <GeneralSettings defaultCurrency={defaultSettings.currency} />
        </TabsContent>
        <TabsContent value="dashboard" className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4">
                 <h2 className="text-2xl font-bold tracking-tight">Dashboard Config</h2>
                 <p className="text-muted-foreground">Customize what you see on your dashboard.</p>
            </div>
            <DashboardSettings settings={defaultSettings} accounts={accounts} />
        </TabsContent>
         <TabsContent value="data" className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4">
                 <h2 className="text-2xl font-bold tracking-tight">Data Management</h2>
                 <p className="text-muted-foreground">Control your data, export backups, or reset the application.</p>
            </div>
            <DataManagement />
        </TabsContent>
      </div>
    </Tabs>
  );
}
