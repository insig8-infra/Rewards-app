import { AdminRewardsWorkspace } from "../../src/components/AdminRewardsWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function RewardsPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER", "STAFF"], loginRedirectTo: "/rewards" });

  return <AdminRewardsWorkspace session={session} />;
}
