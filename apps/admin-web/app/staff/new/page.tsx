import { AdminStaffCreateWorkspace } from "../../../src/components/AdminStaffWorkspace";
import { requireAdminSession } from "../../../src/auth/adminSession";

export default async function NewStaffPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER", "ADMIN"], loginRedirectTo: "/staff/new" });

  return <AdminStaffCreateWorkspace session={session} />;
}
