import { redirect } from "next/navigation";

/** Legacy route — settings now lives under the dashboard. */
export default function LegacySettingsRedirect() {
  redirect("/dashboard/settings");
}
