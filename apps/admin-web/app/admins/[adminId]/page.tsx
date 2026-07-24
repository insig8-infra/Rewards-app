import { AdminAdminDetailWorkspace } from "../../../src/components/AdminStaffWorkspace";
import { requireAdminSession } from "../../../src/auth/adminSession";

export default async function AdminDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly adminId: string }>;
}) {
  const [{ adminId }, session] = await Promise.all([
    params,
    requireAdminSession({ allowedRoles: ["OWNER"], loginRedirectTo: "/admins" }),
  ]);

  return <AdminAdminDetailWorkspace adminId={adminId} session={session} />;
}
