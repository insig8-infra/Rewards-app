import { PrintHistoryWorkspace } from "../../src/components/PrintHistoryWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function PrintHistoryPage() {
  const session = await requireAdminSession({ loginRedirectTo: "/print-history" });

  return <PrintHistoryWorkspace session={session} />;
}
