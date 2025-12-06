import { getUserSettings } from "@/app/actions/accounts";
import { SettingsForm } from "@/components/settings-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Settings" />
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm defaultCurrency={settings?.currency || "LKR"} />
        </CardContent>
      </Card>
    </div>
  );
}
