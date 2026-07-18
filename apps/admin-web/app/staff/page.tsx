import { AdminStaffWorkspace } from "../../src/components/AdminStaffWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function StaffPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER"], loginRedirectTo: "/staff" });

  return <AdminStaffWorkspace session={session} />;
}
