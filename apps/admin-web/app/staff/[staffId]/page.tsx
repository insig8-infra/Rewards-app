import { AdminStaffDetailWorkspace } from "../../../src/components/AdminStaffWorkspace";
import { requireAdminSession } from "../../../src/auth/adminSession";

export default async function StaffDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly staffId: string }>;
}) {
  const [{ staffId }, session] = await Promise.all([
    params,
    requireAdminSession({ allowedRoles: ["OWNER", "ADMIN"], loginRedirectTo: "/staff" }),
  ]);

  return <AdminStaffDetailWorkspace session={session} staffId={staffId} />;
}
