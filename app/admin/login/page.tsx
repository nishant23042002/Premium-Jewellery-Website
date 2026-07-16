"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AdminAuthDivider,
  AdminGoogleSignInButton,
} from "@/components/admin/admin-google-signin-button";
import { loginAction } from "@/features/auth/auth.actions";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/features/auth/auth.schema";
import { toast } from "@/lib/toast";
import { ROUTES, SITE } from "@/constants";

const GOOGLE_LOGIN_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in isn't configured for this site.",
  google_rate_limited: "Too many attempts. Please try again shortly.",
  google_denied: "Google sign-in was cancelled.",
  google_invalid_state: "That link expired. Please try again.",
  google_not_linked:
    "That Google account isn't linked to an admin. Sign in with your password, then link Google from Settings > Security.",
  google_account_deactivated: "This account has been deactivated.",
  google_signin_failed: "Couldn't sign in with Google. Please try again.",
  session_required: "Sign in with your password first, then link Google from Settings.",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleError = searchParams.get("error");
  const googleErrorMessage = googleError
    ? (GOOGLE_LOGIN_ERROR_MESSAGES[googleError] ?? "Couldn't sign in with Google.")
    : undefined;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const result = await loginAction(values);
      if (!result.success) {
        toast.error("Couldn't sign in", result.error);
        return;
      }
      router.push(ROUTES.admin.dashboard);
      router.refresh();
    } catch {
      toast.error("Couldn't sign in", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/20 px-4">
      <Card className="w-full max-w-sm border-border/60">
        <CardContent className="pt-2">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-gold/10">
              <Lock className="size-4 text-gold-dark" />
            </div>
            <h1 className="font-heading text-xl">{SITE.name}</h1>
            <p className="text-xs text-muted-foreground">Admin sign-in</p>
          </div>

          {googleErrorMessage && (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
              {googleErrorMessage}
            </p>
          )}

          <div className="mb-4 space-y-4">
            <AdminGoogleSignInButton />
            <AdminAuthDivider />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-right">
                <Link
                  href={ROUTES.admin.forgotPassword}
                  className="text-xs text-gold-dark hover:underline"
                >
                  Forgot password?
                </Link>
              </p>
              <Button
                type="submit"
                variant="gold"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
