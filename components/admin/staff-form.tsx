"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createAdminUser,
  updateAdminUser,
} from "@/features/auth/admin-user.actions";
import {
  adminUserFormSchema,
  type AdminUserFormInput,
} from "@/features/auth/admin-user.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { AdminUser } from "@/features/auth/admin-user.types";
import type { Role } from "@/features/roles/role.types";

interface StaffFormProps {
  staffMember?: AdminUser;
  roles: Role[];
  isSelf: boolean;
}

export function StaffForm({ staffMember, roles, isSelf }: StaffFormProps) {
  const router = useRouter();
  const isEditing = !!staffMember;

  const form = useForm<AdminUserFormInput>({
    resolver: zodResolver(adminUserFormSchema),
    defaultValues: {
      name: staffMember?.name ?? "",
      email: staffMember?.email ?? "",
      password: "",
      role: staffMember?.role ?? "staff",
      roleSlug: staffMember?.roleSlug ?? "",
      isActive: staffMember?.isActive ?? true,
    },
  });

  const roleValue = form.watch("role");

  async function onSubmit(values: AdminUserFormInput) {
    const result = isEditing
      ? await updateAdminUser(staffMember.id, values)
      : await createAdminUser(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} account`,
        result.error,
      );
      return;
    }

    toast.success(`Staff account ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.staff);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-lg space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEditing ? "New password (optional)" : "Password"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={
                    isEditing ? "Leave blank to keep current password" : ""
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access level</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="owner">Owner (full access)</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {roleValue === "staff" && (
            <FormField
              control={form.control}
              name="roleSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value || "staff"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.slug} value={role.slug}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>Active</FormLabel>
                <p className="text-xs text-muted-foreground">
                  {isSelf
                    ? "You can't deactivate your own account."
                    : "Turn off to block this account from signing in, without deleting it."}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSelf}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="gold"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {isEditing ? "Save Changes" : "Create Account"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.staff)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
