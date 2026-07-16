"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AuthDivider,
  GoogleSignInButton,
} from "@/components/storefront/google-signin-button";
import { customerLoginAction } from "@/features/customer-auth/customer-auth.actions";
import {
  customerLoginFormSchema,
  type CustomerLoginFormValues,
} from "@/features/customer-auth/customer-account.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

const LOCAL_TEXT = {
  couldntSignYouIn: {
    en: "Couldn't sign you in",
    hi: "आपको साइन इन नहीं किया जा सका",
    mr: "तुम्हाला साइन इन करता आले नाही",
  },
  emailLabel: { en: "Email", hi: "ईमेल", mr: "ईमेल" },
  newHereQuestion: { en: "New here?", hi: "नए हैं?", mr: "नवीन आहात?" },
} as const;

interface CustomerLoginFormProps {
  redirectTo?: string;
  /** When provided (e.g. inside a modal), called instead of navigating away on success. */
  onSuccess?: () => void;
  /** When provided (e.g. inside a modal with tabs), renders a tab-switch button instead of a page link. */
  onSwitchToSignup?: () => void;
  /** Background the form renders on — passed through to AuthDivider so its label matches. */
  surfaceClassName?: string;
  /** Pre-filled error to toast on mount — used for the ?error= redirect back from a failed Google sign-in. */
  initialError?: string;
  locale?: Locale;
}

export function CustomerLoginForm({
  redirectTo = ROUTES.account,
  onSuccess,
  onSwitchToSignup,
  surfaceClassName,
  initialError,
  locale = "en",
}: CustomerLoginFormProps) {
  const router = useRouter();

  const form = useForm<CustomerLoginFormValues>({
    resolver: zodResolver(customerLoginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (initialError) {
      toast.error(LOCAL_TEXT.couldntSignYouIn[locale], initialError);
    }
    // Only meant to fire once, for the error the page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: CustomerLoginFormValues) {
    const result = await customerLoginAction(values);
    if (!result.success) {
      toast.error(LOCAL_TEXT.couldntSignYouIn[locale], result.error);
      return;
    }
    router.refresh();
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(redirectTo);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <GoogleSignInButton redirectTo={redirectTo} locale={locale} />
        <AuthDivider surfaceClassName={surfaceClassName} locale={locale} />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{LOCAL_TEXT.emailLabel[locale]}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
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
              <div className="flex items-center justify-between">
                <FormLabel>{t("password", locale)}</FormLabel>
                <Link
                  href={ROUTES.accountForgotPassword}
                  className="text-xs text-gold-dark hover:underline"
                >
                  {t("forgotPassword", locale)}
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {t("signIn", locale)}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {LOCAL_TEXT.newHereQuestion[locale]}{" "}
          {onSwitchToSignup ? (
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-gold-dark hover:underline"
            >
              {t("createAccount", locale)}
            </button>
          ) : (
            <Link
              href={ROUTES.accountSignup}
              className="text-gold-dark hover:underline"
            >
              {t("createAccount", locale)}
            </Link>
          )}
        </p>
      </form>
    </Form>
  );
}
