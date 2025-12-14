import { getAccounts, getUserSettings } from "@/app/actions/accounts";
import { SettingsForm } from "@/components/settings-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataManagement } from "@/components/data-management";

export default async function SettingsPage() {
  const settings = await getUserSettings();
  const allAccounts = await getAccounts();
  // Filter accounts for net worth calculation (assets and liabilities only)
  const accounts = allAccounts.filter(a => a.type === "asset" || a.type === "liability");

  const defaultSettings = {
    currency: settings?.currency || "LKR",
    showNetWorth: settings?.showNetWorth ?? true,
    showMonthlySpending: settings?.showMonthlySpending ?? true,
    showDefinedNetWorth: settings?.showDefinedNetWorth ?? false,
    definedNetWorthIncludes: settings?.definedNetWorthIncludes || [],
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Settings" />
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm defaultSettings={defaultSettings} accounts={accounts} />
        </CardContent>
      </Card>
      
      <DataManagement />
    </div>
  );
}
