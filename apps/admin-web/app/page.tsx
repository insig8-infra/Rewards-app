import { QrPrintWorkspace } from "../src/components/QrPrintWorkspace";
import { requireAdminSession } from "../src/auth/adminSession";

export default async function HomePage({
  searchParams,
}: {
  readonly searchParams?: Promise<{ readonly invoiceId?: string | readonly string[] }>;
}) {
  const params = searchParams ? await searchParams : {};
  const invoiceId = Array.isArray(params.invoiceId) ? params.invoiceId[0] : params.invoiceId;
  const loginRedirectTo = invoiceId ? `/?invoiceId=${encodeURIComponent(invoiceId)}` : "/";
  const session = await requireAdminSession({ loginRedirectTo });

  return <QrPrintWorkspace initialInvoiceId={invoiceId} session={session} />;
}
