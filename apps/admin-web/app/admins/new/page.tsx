import { AdminAdminCreateWorkspace } from "../../../src/components/AdminStaffWorkspace";
import { requireAdminSession } from "../../../src/auth/adminSession";

export default async function NewAdminPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER"], loginRedirectTo: "/admins/new" });

  return <AdminAdminCreateWorkspace session={session} />;
}
