import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RoleForm } from "@/components/admin/role-form";
import { ROUTES } from "@/constants/routes";

export default function NewRolePage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Role"
        breadcrumbs={[
          { label: "Roles", href: ROUTES.admin.roles },
          { label: "New" },
        ]}
      />
      <RoleForm />
    </div>
  );
}
