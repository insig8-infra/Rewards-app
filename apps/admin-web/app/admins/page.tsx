import { AdminAdminsWorkspace } from "../../src/components/AdminStaffWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function AdminsPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER"], loginRedirectTo: "/admins" });

  return <AdminAdminsWorkspace session={session} />;
}
