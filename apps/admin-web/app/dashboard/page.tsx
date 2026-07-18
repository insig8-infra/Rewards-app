import { AdminDashboardWorkspace } from "../../src/components/AdminDashboardWorkspace";
import { requireAdminSession } from "../../src/auth/adminSession";

interface DashboardPageProps {
  readonly searchParams: Promise<{
    readonly denied?: string | readonly string[];
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const session = await requireAdminSession({ loginRedirectTo: "/dashboard" });
  const denied = firstParam(params.denied) === "1";

  return <AdminDashboardWorkspace denied={denied} session={session} />;
}

function firstParam(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}
