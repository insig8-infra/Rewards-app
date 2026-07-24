import { AdminReportsWorkspace } from "../../src/components/AdminReportsWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function ReportsPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER", "ADMIN", "STAFF"], loginRedirectTo: "/reports" });

  return <AdminReportsWorkspace session={session} />;
}
