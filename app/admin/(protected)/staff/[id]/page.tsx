import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StaffForm } from "@/components/admin/staff-form";
import { getAdminUserByIdForAdmin } from "@/features/auth/admin-user.actions";
import { listRoles } from "@/features/roles/role.actions";
import { getSession } from "@/lib/auth/session";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditStaffPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const { id } = await params;

  const [staffMember, roles, session] = await Promise.all([
    safeQuery(() => getAdminUserByIdForAdmin(id), null),
    safeQuery(() => listRoles(), []),
    getSession(),
  ]);

  if (!staffMember) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={staffMember.name}
        breadcrumbs={[
          { label: "Staff", href: ROUTES.admin.staff },
          { label: staffMember.name },
        ]}
      />
      <StaffForm
        staffMember={staffMember}
        roles={roles}
        isSelf={session?.sub === staffMember.id}
      />
    </div>
  );
}
