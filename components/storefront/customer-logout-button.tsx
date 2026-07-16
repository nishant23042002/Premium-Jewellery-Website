"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customerLogoutAction } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

export function CustomerLogoutButton({
  locale = "en",
}: {
  locale?: Locale;
}) {
  const router = useRouter();

  async function handleLogout() {
    await customerLogoutAction();
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="size-3.5" />
      {t("signOut", locale)}
    </Button>
  );
}
