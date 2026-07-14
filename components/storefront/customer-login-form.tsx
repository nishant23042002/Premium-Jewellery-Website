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
}

export function CustomerLoginForm({
  redirectTo = ROUTES.account,
  onSuccess,
  onSwitchToSignup,
  surfaceClassName,
  initialError,
}: CustomerLoginFormProps) {
  const router = useRouter();

  const form = useForm<CustomerLoginFormValues>({
    resolver: zodResolver(customerLoginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (initialError) {
      toast.error("Couldn't sign you in", initialError);
    }
    // Only meant to fire once, for the error the page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: CustomerLoginFormValues) {
    const result = await customerLoginAction(values);
    if (!result.success) {
      toast.error("Couldn't sign you in", result.error);
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
        <GoogleSignInButton redirectTo={redirectTo} />
        <AuthDivider surfaceClassName={surfaceClassName} />
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href={ROUTES.accountForgotPassword}
                  className="text-xs text-gold-dark hover:underline"
                >
                  Forgot password?
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
          Sign In
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          {onSwitchToSignup ? (
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-gold-dark hover:underline"
            >
              Create an account
            </button>
          ) : (
            <Link
              href={ROUTES.accountSignup}
              className="text-gold-dark hover:underline"
            >
              Create an account
            </Link>
          )}
        </p>
      </form>
    </Form>
  );
}
