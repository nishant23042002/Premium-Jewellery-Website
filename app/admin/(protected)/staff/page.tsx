import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StaffTable } from "@/components/admin/staff-table";
import { Button } from "@/components/ui/button";
import { listAdminUsers } from "@/features/auth/admin-user.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminStaffPage() {
  const staff = await safeQuery(() => listAdminUsers(), []);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Staff"
        description={`${staff.length} account${staff.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Staff" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.staffNew} />}
          >
            <Plus className="size-3.5" />
            New Account
          </Button>
        }
      />
      <StaffTable data={staff} />
    </div>
  );
}
