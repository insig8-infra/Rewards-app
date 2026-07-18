import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import { AdminWebDashboardService } from "./admin-web-dashboard.service.js";
import type { AdminWebDashboardRepository } from "./admin-web-dashboard.repository.js";

test("AdminWebDashboardService returns role-scoped dashboard sections", async () => {
  const service = new AdminWebDashboardService({
    getDashboard: (actorRole) =>
      Promise.resolve({
        actorRole,
        roleLabel: actorRole === ACTOR_ROLE.OWNER ? "Owner dashboard" : "Staff dashboard",
        allowedSections: actorRole === ACTOR_ROLE.OWNER ? ["staff"] : ["contractors-readonly"],
        metrics: {
          contractors: 0,
          staff: 0,
          invoices: 0,
          qrTotal: 0,
          qrNotPrinted: 0,
          qrPrinted: 0,
          qrScanned: 0,
          qrCancelled: 0,
          qrReversed: 0,
          rewardClaims: 0,
          invoicesReadyToPrint: 0,
          pendingRewardClaims: 0,
          recentReturns: 0,
        },
        attentionQueue: [],
        shortcuts: [],
        qrStatusMix: [],
        printTrend: [],
        topContractors: [],
        recentActivity: [],
      }),
  } as AdminWebDashboardRepository);

  const ownerDashboard = await service.getDashboard(ACTOR_ROLE.OWNER);
  const staffDashboard = await service.getDashboard(ACTOR_ROLE.STAFF);

  assert.deepEqual(ownerDashboard.allowedSections, ["staff"]);
  assert.deepEqual(staffDashboard.allowedSections, ["contractors-readonly"]);
});
