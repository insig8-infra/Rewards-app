import { AdminLoginWorkspace } from "../../src/components/AdminLoginWorkspace";

interface LoginPageProps {
  readonly searchParams: Promise<{
    readonly expired?: string | readonly string[];
    readonly next?: string | readonly string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = toSafePath(firstParam(params.next)) ?? "/dashboard";
  const expired = firstParam(params.expired) === "1";

  return <AdminLoginWorkspace expired={expired} nextPath={nextPath} />;
}

function firstParam(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

function toSafePath(value: string | undefined): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return undefined;
  }

  return value;
}
