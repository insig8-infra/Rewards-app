import { requireAdminSession } from "../../../src/auth/adminSession";
import { InvoiceDetailWorkspace } from "../../../src/components/InvoiceDetailWorkspace";

interface InvoiceDetailPageProps {
  readonly params: Promise<{
    readonly invoiceId: string;
  }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const session = await requireAdminSession({ loginRedirectTo: `/invoices/${invoiceId}` });

  return <InvoiceDetailWorkspace invoiceId={invoiceId} session={session} />;
}
