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

interface CustomerSignupFormProps {
  redirectTo?: string;
  /** When provided (e.g. inside a modal), called instead of navigating away on success. */
  onSuccess?: () => void;
  /** When provided (e.g. inside a modal with tabs), renders a tab-switch button instead of a page link. */
  onSwitchToLogin?: () => void;
  /** Background the form renders on — passed through to AuthDivider so its label matches. */
  surfaceClassName?: string;
}

export function CustomerSignupForm({
  redirectTo = ROUTES.account,
  onSuccess,
  onSwitchToLogin,
  surfaceClassName,
}: CustomerSignupFormProps = {}) {
  const router = useRouter();

  const form = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  async function onSubmit(values: SignupFormValues) {
    const result = await signupAction(values);
    if (!result.success) {
      toast.error("Couldn't create your account", result.error);
      return;
    }
    toast.success("Account created — welcome!");
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
        <GoogleSignInButton redirectTo={redirectTo} label="Sign up with Google" />
        <AuthDivider surfaceClassName={surfaceClassName} />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
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
              <FormLabel>Password</FormLabel>
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
          Create Account
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-gold-dark hover:underline"
            >
              Sign in
            </button>
          ) : (
            <Link
              href={ROUTES.accountLogin}
              className="text-gold-dark hover:underline"
            >
              Sign in
            </Link>
          )}
        </p>
      </form>
    </Form>
  );
}
