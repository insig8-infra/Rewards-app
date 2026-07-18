import { AdminStaffSelfProfileWorkspace } from "../../src/components/AdminStaffWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function AdminProfilePage() {
  const session = await requireAdminSession({ allowedRoles: ["STAFF"], loginRedirectTo: "/profile" });

  return <AdminStaffSelfProfileWorkspace session={session} />;
}
