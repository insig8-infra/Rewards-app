import type { CommitScanCartResult } from "./api";
import type { StoredSession } from "./storage";

export function applyScanBalance(session: StoredSession, result: CommitScanCartResult): StoredSession {
  return {
    ...session,
    contractor: {
      ...session.contractor,
      availablePoints: result.balanceAfter,
      totalAccumulatedPoints: result.totalAccumulatedPoints,
    },
  };
}
