import { AdminContractorDetailWorkspace } from "../../../src/components/AdminContractorsWorkspace";
import { requireAdminSession } from "../../../src/auth/adminSession";

export default async function ContractorDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly contractorId: string }>;
}) {
  const [{ contractorId }, session] = await Promise.all([
    params,
    requireAdminSession({ loginRedirectTo: "/contractors" }),
  ]);

  return <AdminContractorDetailWorkspace contractorId={contractorId} session={session} />;
}
