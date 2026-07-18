import { AdminContractorCreateWorkspace } from "../../../src/components/AdminContractorsWorkspace";
import { requireAdminSession } from "../../../src/auth/adminSession";

export default async function NewContractorPage() {
  const session = await requireAdminSession({ allowedRoles: ["OWNER"], loginRedirectTo: "/contractors/new" });

  return <AdminContractorCreateWorkspace session={session} />;
}
