import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminForgotPasswordForm } from "@/components/admin/admin-forgot-password-form";
import { SITE } from "@/constants";

export const metadata: Metadata = {
  title: "Forgot Password — Admin",
  robots: { index: false, follow: false },
};

export default function AdminForgotPasswordPage() {
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
          <AdminForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
