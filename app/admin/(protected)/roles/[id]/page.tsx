import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RoleForm } from "@/components/admin/role-form";
import { getRoleById } from "@/features/roles/role.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const { id } = await params;
  const role = await safeQuery(() => getRoleById(id), null);
  if (!role) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={role.name}
        breadcrumbs={[
          { label: "Roles", href: ROUTES.admin.roles },
          { label: role.name },
        ]}
      />
      <RoleForm role={role} />
    </div>
  );
}
