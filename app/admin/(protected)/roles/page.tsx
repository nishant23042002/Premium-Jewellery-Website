import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RolesTable } from "@/components/admin/roles-table";
import { Button } from "@/components/ui/button";
import { listRoles } from "@/features/roles/role.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminRolesPage() {
  const roles = await safeQuery(() => listRoles(), []);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Roles & Permissions"
        description="Owner always has full access. Staff accounts inherit whatever role they're assigned."
        breadcrumbs={[{ label: "Roles" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.roleNew} />}
          >
            <Plus className="size-3.5" />
            New Role
          </Button>
        }
      />
      <RolesTable data={roles} />
    </div>
  );
}
