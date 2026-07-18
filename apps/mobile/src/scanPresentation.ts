export type ScanPresentationRole = "CONTRACTOR" | "TEAM_MEMBER";

export function shouldShowScanPoints(role: ScanPresentationRole): boolean {
  return role === "CONTRACTOR";
}
