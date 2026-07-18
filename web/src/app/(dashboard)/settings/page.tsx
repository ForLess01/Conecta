import { getAccountSettings } from "@/lib/server/account/account";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getAccountSettings();
  return <SettingsForm initialSettings={settings} />;
}
