"use client";

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
import { signupAction } from "@/features/customer-auth/customer-auth.actions";
import {
  signupFormSchema,
  type SignupFormInput,
  type SignupFormValues,
} from "@/features/customer-auth/customer-account.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

const LOCAL_TEXT = {
  couldntCreateAccount: {
    en: "Couldn't create your account",
    hi: "आपका खाता नहीं बनाया जा सका",
    mr: "तुमचे खाते तयार करता आले नाही",
  },
  accountCreatedWelcome: {
    en: "Account created — welcome!",
    hi: "खाता बन गया — स्वागत है!",
    mr: "खाते तयार झाले — स्वागत आहे!",
  },
  signUpWithGoogle: {
    en: "Sign up with Google",
    hi: "Google से साइन अप करें",
    mr: "Google सह साइन अप करा",
  },
  emailLabel: { en: "Email", hi: "ईमेल", mr: "ईमेल" },
  phoneOptional: { en: "Phone (optional)", hi: "फ़ोन (वैकल्पिक)", mr: "फोन (ऐच्छिक)" },
  alreadyHaveAccount: {
    en: "Already have an account?",
    hi: "पहले से खाता है?",
    mr: "आधीच खाते आहे?",
  },
} as const;

interface CustomerSignupFormProps {
  redirectTo?: string;
  /** When provided (e.g. inside a modal), called instead of navigating away on success. */
  onSuccess?: () => void;
  /** When provided (e.g. inside a modal with tabs), renders a tab-switch button instead of a page link. */
  onSwitchToLogin?: () => void;
  /** Background the form renders on — passed through to AuthDivider so its label matches. */
  surfaceClassName?: string;
  locale?: Locale;
}

export function CustomerSignupForm({
  redirectTo = ROUTES.account,
  onSuccess,
  onSwitchToLogin,
  surfaceClassName,
  locale = "en",
}: CustomerSignupFormProps = {}) {
  const router = useRouter();

  const form = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  async function onSubmit(values: SignupFormValues) {
    const result = await signupAction(values);
    if (!result.success) {
      toast.error(LOCAL_TEXT.couldntCreateAccount[locale], result.error);
      return;
    }
    toast.success(LOCAL_TEXT.accountCreatedWelcome[locale]);
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
        <GoogleSignInButton
          redirectTo={redirectTo}
          label={LOCAL_TEXT.signUpWithGoogle[locale]}
          locale={locale}
        />
        <AuthDivider surfaceClassName={surfaceClassName} locale={locale} />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fullName", locale)}</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{LOCAL_TEXT.phoneOptional[locale]}</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+91 98765 43210" {...field} />
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
              <FormLabel>{t("password", locale)}</FormLabel>
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
          {t("createAccount", locale)}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {LOCAL_TEXT.alreadyHaveAccount[locale]}{" "}
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-gold-dark hover:underline"
            >
              {t("signIn", locale)}
            </button>
          ) : (
            <Link
              href={ROUTES.accountLogin}
              className="text-gold-dark hover:underline"
            >
              {t("signIn", locale)}
            </Link>
          )}
        </p>
      </form>
    </Form>
  );
}
