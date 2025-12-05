import { getUserSettings } from "@/app/actions/accounts";
import { SettingsForm } from "@/components/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm defaultCurrency={settings?.currency || "USD"} />
        </CardContent>
      </Card>
    </div>
  );
}
