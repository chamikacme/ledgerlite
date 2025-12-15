import { getAccounts, getUserSettings } from "@/app/actions/accounts";
import { PageHeader } from "@/components/page-header";
import { SettingsShell } from "@/components/settings-shell";

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
      <SettingsShell defaultSettings={defaultSettings} accounts={accounts} />
    </div>
  );
}
