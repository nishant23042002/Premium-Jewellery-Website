import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminResetPasswordForm } from "@/components/admin/admin-reset-password-form";
import { SITE } from "@/constants";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Reset Password — Admin",
  robots: { index: false, follow: false },
};

interface AdminResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AdminResetPasswordPage({
  searchParams,
}: AdminResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/20 px-4">
      <Card className="w-full max-w-sm border-border/60">
        <CardContent className="pt-2">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-gold/10">
              <KeyRound className="size-4 text-gold-dark" />
            </div>
            <h1 className="font-heading text-xl">{SITE.name}</h1>
            <p className="text-xs text-muted-foreground">Admin account recovery</p>
          </div>
          {token ? (
            <AdminResetPasswordForm token={token} />
          ) : (
            <div className="space-y-3 text-center text-sm text-muted-foreground">
              <p>This reset link is missing its token.</p>
              <Link
                href={ROUTES.admin.forgotPassword}
                className="inline-block text-gold-dark hover:underline"
              >
                Request a new reset link
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
