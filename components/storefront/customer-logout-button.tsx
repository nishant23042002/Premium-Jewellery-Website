"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customerLogoutAction } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";

export function CustomerLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await customerLogoutAction();
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="size-3.5" />
      Sign Out
    </Button>
  );
}
