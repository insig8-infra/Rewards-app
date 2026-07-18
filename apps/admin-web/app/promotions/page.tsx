import { AdminPromotionsWorkspace } from "../../src/components/AdminPromotionsWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function PromotionsPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER"], loginRedirectTo: "/promotions" });

  return <AdminPromotionsWorkspace session={session} />;
}
