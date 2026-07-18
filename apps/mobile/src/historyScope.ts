export type MobileActorRole = "CONTRACTOR" | "TEAM_MEMBER";

export interface HistoryRequestScope {
  readonly role: MobileActorRole;
  readonly contractorId: string;
  readonly teamMemberMobile?: string;
}

export function describeHistoryScope(scope: HistoryRequestScope): "FULL_CONTRACTOR" | "TEAM_MEMBER_ATTRIBUTED" {
  return scope.role === "TEAM_MEMBER" ? "TEAM_MEMBER_ATTRIBUTED" : "FULL_CONTRACTOR";
}

export function canShowTeamMemberHistory(scope: HistoryRequestScope): boolean {
  return scope.role !== "TEAM_MEMBER" || Boolean(scope.teamMemberMobile);
}
