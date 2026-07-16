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
import { resetAdminPasswordAction } from "@/features/auth/auth.actions";
import {
  resetAdminPasswordSchema,
  type ResetAdminPasswordInput,
} from "@/features/auth/auth.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";

export function AdminResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const form = useForm<ResetAdminPasswordInput>({
    resolver: zodResolver(resetAdminPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetAdminPasswordInput) {
    const result = await resetAdminPasswordAction(values);
    if (!result.success) {
      toast.error("Couldn't reset the password", result.error);
      return;
    }
    toast.success(
      "Password reset",
      "Sign in with the new password to continue.",
    );
    router.push(ROUTES.admin.login);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
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
              <FormLabel>Confirm new password</FormLabel>
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
          Reset Password
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href={ROUTES.admin.login} className="text-gold-dark hover:underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </Form>
  );
}
