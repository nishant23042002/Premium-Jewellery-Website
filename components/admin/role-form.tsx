"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createRole, updateRole } from "@/features/roles/role.actions";
import {
  roleFormSchema,
  type RoleFormInput,
} from "@/features/roles/role.schema";
import { PERMISSIONS, PERMISSION_GROUPS } from "@/constants/permissions";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { Role } from "@/features/roles/role.types";

export function RoleForm({ role }: { role?: Role }) {
  const router = useRouter();
  const isEditing = !!role;
  const isSystem = role?.isSystem ?? false;

  const form = useForm<RoleFormInput>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name ?? "",
      slug: role?.slug ?? "",
      permissions: role?.permissions ?? [],
    },
  });

  const permissions = form.watch("permissions") ?? [];

  function togglePermission(key: string, checked: boolean) {
    const current = form.getValues("permissions") ?? [];
    form.setValue(
      "permissions",
      checked ? [...current, key] : current.filter((p) => p !== key),
      { shouldDirty: true },
    );
  }

  async function onSubmit(values: RoleFormInput) {
    const result = isEditing
      ? await updateRole(role.id, values)
      : await createRole(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} role`,
        result.error,
      );
      return;
    }

    toast.success(`Role ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.roles);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role name</FormLabel>
                <FormControl>
                  <Input placeholder="Sales Staff" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="sales-staff"
                    disabled={isSystem}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {isSystem && (
                  <p className="text-xs text-muted-foreground">
                    Built-in roles keep a fixed slug.
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <Label>Permissions</Label>
          {PERMISSION_GROUPS.map((group) => {
            const groupPermissions = PERMISSIONS.filter(
              (p) => p.group === group,
            );
            return (
              <div key={group} className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {group}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {groupPermissions.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={permissions.includes(permission.key)}
                        onCheckedChange={(checked) =>
                          togglePermission(permission.key, checked === true)
                        }
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="gold"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {isEditing ? "Save Changes" : "Create Role"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.roles)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
