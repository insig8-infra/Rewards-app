import { InvoiceLedgerWorkspace } from "../../src/components/InvoiceLedgerWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

export default async function InvoicesPage() {
  const session = await requireAdminSession({ loginRedirectTo: "/invoices" });

  return <InvoiceLedgerWorkspace session={session} />;
}
