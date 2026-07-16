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
import { resetPasswordAction } from "@/features/customer-auth/customer-auth.actions";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/customer-auth/customer-account.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

const LOCAL_TEXT = {
  couldntResetPassword: {
    en: "Couldn't reset your password",
    hi: "आपका पासवर्ड रीसेट नहीं किया जा सका",
    mr: "तुमचा पासवर्ड रीसेट करता आला नाही",
  },
  passwordReset: { en: "Password reset", hi: "पासवर्ड रीसेट हुआ", mr: "पासवर्ड रीसेट झाला" },
  signInWithNewPassword: {
    en: "Sign in with your new password to continue.",
    hi: "जारी रखने के लिए अपने नए पासवर्ड से साइन इन करें।",
    mr: "पुढे जाण्यासाठी तुमच्या नवीन पासवर्डने साइन इन करा.",
  },
  newPassword: { en: "New password", hi: "नया पासवर्ड", mr: "नवीन पासवर्ड" },
  confirmNewPassword: { en: "Confirm new password", hi: "नए पासवर्ड की पुष्टि करें", mr: "नवीन पासवर्डची पुष्टी करा" },
} as const;

export function ResetPasswordForm({
  token,
  locale = "en",
}: {
  token: string;
  locale?: Locale;
}) {
  const router = useRouter();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    const result = await resetPasswordAction(values);
    if (!result.success) {
      toast.error(LOCAL_TEXT.couldntResetPassword[locale], result.error);
      return;
    }
    toast.success(
      LOCAL_TEXT.passwordReset[locale],
      LOCAL_TEXT.signInWithNewPassword[locale],
    );
    router.push(ROUTES.accountLogin);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{LOCAL_TEXT.newPassword[locale]}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{LOCAL_TEXT.confirmNewPassword[locale]}</FormLabel>
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
          {t("resetPassword", locale)}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href={ROUTES.accountLogin} className="text-gold-dark hover:underline">
            {t("backToSignIn", locale)}
          </Link>
        </p>
      </form>
    </Form>
  );
}
