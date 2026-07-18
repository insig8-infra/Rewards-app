import { AdminContractorsWorkspace } from "../../src/components/AdminContractorsWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function ContractorsPage() {
  const session = await requireAdminSession({ loginRedirectTo: "/contractors" });

  return <AdminContractorsWorkspace session={session} />;
}
