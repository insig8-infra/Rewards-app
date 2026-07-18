import { ACTOR_ROLE, type ActorRole } from "@volt-rewards/domain";

export interface AuthenticatedActor {
  readonly role: ActorRole;
  readonly userId?: string;
  readonly contractorId?: string;
  readonly teamMemberMobile?: string;
}

export interface RequestWithActor {
  readonly headers: Record<string, string | string[] | undefined>;
  actor?: AuthenticatedActor;
}

const actorRoles = new Set<ActorRole>(Object.values(ACTOR_ROLE));

export function parseActorFromHeaders(headers: Record<string, string | string[] | undefined>): AuthenticatedActor | null {
  const role = getSingleHeader(headers, "x-actor-role");
  if (!role || !actorRoles.has(role as ActorRole)) {
    return null;
  }

  const userId = getSingleHeader(headers, "x-actor-user-id");
  const contractorId = getSingleHeader(headers, "x-actor-contractor-id");
  const teamMemberMobile = getSingleHeader(headers, "x-actor-team-member-mobile");

  return {
    role: role as ActorRole,
    ...(userId ? { userId } : {}),
    ...(contractorId ? { contractorId } : {}),
    ...(teamMemberMobile ? { teamMemberMobile } : {}),
  };
}

function getSingleHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
