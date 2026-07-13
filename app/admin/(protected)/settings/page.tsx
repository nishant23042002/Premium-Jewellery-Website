import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function AdminSettingsPage() {
  redirect(ROUTES.admin.settingsAppearance);
}
