"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";
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
import { requestPasswordResetAction } from "@/features/customer-auth/customer-auth.actions";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "@/features/customer-auth/customer-account.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

const LOCAL_TEXT = {
  couldntSendThat: {
    en: "Couldn't send that",
    hi: "वह भेजा नहीं जा सका",
    mr: "ते पाठवता आले नाही",
  },
  ifAccountExists: {
    en: "If an account exists for that email, we've sent a link to reset your password. It expires in 1 hour.",
    hi: "यदि उस ईमेल के लिए कोई खाता मौजूद है, तो हमने आपका पासवर्ड रीसेट करने के लिए एक लिंक भेजा है। यह 1 घंटे में समाप्त हो जाता है।",
    mr: "त्या ईमेलसाठी खाते अस्तित्वात असल्यास, आम्ही तुमचा पासवर्ड रीसेट करण्यासाठी लिंक पाठवली आहे. ती 1 तासात कालबाह्य होते.",
  },
  emailLabel: { en: "Email", hi: "ईमेल", mr: "ईमेल" },
  enterEmailToReset: {
    en: "Enter the email on your account and we'll send you a link to reset your password.",
    hi: "अपने खाते का ईमेल दर्ज करें और हम आपको पासवर्ड रीसेट करने के लिए एक लिंक भेजेंगे।",
    mr: "तुमच्या खात्याचा ईमेल टाका आणि आम्ही तुम्हाला पासवर्ड रीसेट करण्यासाठी लिंक पाठवू.",
  },
  sendResetLink: { en: "Send Reset Link", hi: "रीसेट लिंक भेजें", mr: "रीसेट लिंक पाठवा" },
} as const;

export function ForgotPasswordForm({
  locale = "en",
}: {
  locale?: Locale;
}) {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RequestPasswordResetInput) {
    const result = await requestPasswordResetAction(values);
    if (!result.success) {
      toast.error(LOCAL_TEXT.couldntSendThat[locale], result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-8 text-gold" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">
          {LOCAL_TEXT.ifAccountExists[locale]}
        </p>
        <Link
          href={ROUTES.accountLogin}
          className="inline-block text-sm text-gold-dark hover:underline"
        >
          {t("backToSignIn", locale)}
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {LOCAL_TEXT.enterEmailToReset[locale]}
        </p>
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
        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {LOCAL_TEXT.sendResetLink[locale]}
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
