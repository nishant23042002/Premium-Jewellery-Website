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

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RequestPasswordResetInput) {
    const result = await requestPasswordResetAction(values);
    if (!result.success) {
      toast.error("Couldn't send that", result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-8 text-gold" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, we&apos;ve sent a link to
          reset your password. It expires in 1 hour.
        </p>
        <Link
          href={ROUTES.accountLogin}
          className="inline-block text-sm text-gold-dark hover:underline"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the email on your account and we&apos;ll send you a link to
          reset your password.
        </p>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
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
          Send Reset Link
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href={ROUTES.accountLogin} className="text-gold-dark hover:underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </Form>
  );
}
