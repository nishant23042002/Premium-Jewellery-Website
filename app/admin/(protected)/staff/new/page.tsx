import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StaffForm } from "@/components/admin/staff-form";
import { listRoles } from "@/features/roles/role.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function NewStaffPage() {
  const roles = await safeQuery(() => listRoles(), []);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Staff Account"
        breadcrumbs={[
          { label: "Staff", href: ROUTES.admin.staff },
          { label: "New" },
        ]}
      />
      <StaffForm roles={roles} isSelf={false} />
    </div>
  );
}
