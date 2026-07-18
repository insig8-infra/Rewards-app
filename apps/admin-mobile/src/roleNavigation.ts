export type AdminRole = "OWNER" | "STAFF";

export type AdminTab = "Dashboard" | "ReturnScan" | "Contractors" | "Rewards" | "Reports";

export function tabsForRole(role: AdminRole): readonly AdminTab[] {
  if (role === "OWNER") {
    return ["Dashboard", "ReturnScan", "Contractors", "Rewards", "Reports"];
  }

  return ["Dashboard", "ReturnScan", "Contractors", "Rewards", "Reports"];
}

export function canUseOwnerAction(role: AdminRole): boolean {
  return role === "OWNER";
}
