import { AdminItemCodesWorkspace } from "../../src/components/AdminItemCodesWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function ItemCodesPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER", "STAFF"], loginRedirectTo: "/item-codes" });

  return <AdminItemCodesWorkspace session={session} />;
}
