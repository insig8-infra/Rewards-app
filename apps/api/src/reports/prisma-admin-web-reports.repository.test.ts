import assert from "node:assert/strict";
import test from "node:test";
import { PrismaAdminWebReportsRepository } from "./prisma-admin-web-reports.repository.js";
import type { AdminReportFilters } from "./reports.types.js";

const filters: AdminReportFilters = {
  rangePreset: "custom",
  from: new Date("2026-07-01T00:00:00.000Z"),
  to: new Date("2026-08-01T00:00:00.000Z"),
  page: 1,
  pageSize: 25,
};

test("Contractor Leaderboard report exposes Points Used and contractor Area", async () => {
  const repository = new PrismaAdminWebReportsRepository({
    contractor: {
      findMany: async () => [
        {
          id: "contractor_1",
          code: "CTR-1001",
          tier: "Gold",
          totalAccumulatedPoints: 420,
          availablePoints: 270,
          belongsToNote: "Baner",
          user: {
            displayName: "Amit Sharma",
            mobileNumber: "9876543210",
          },
          sites: [
            {
              area: "Kalyani Nagar",
              clientName: "Kumar Heights",
            },
          ],
          scanAttempts: [
            {
              result: "SUCCESS",
              createdAt: new Date("2026-07-10T10:00:00.000Z"),
            },
            {
              result: "ALREADY_CLAIMED",
              createdAt: new Date("2026-07-11T10:00:00.000Z"),
            },
          ],
          rewardClaims: [
            {
              status: "FULFILLED",
              pointsDeducted: 100,
            },
            {
              status: "CHOSEN",
              pointsDeducted: 50,
            },
          ],
        },
      ],
    },
  } as never);

  const report = await repository.getReport("contractor-leaderboard", filters);

  assert.ok(report.columns.some((column) => column.key === "pointsUsed" && column.label === "Points Used"));
  assert.ok(report.columns.some((column) => column.key === "area" && column.label === "Area"));
  assert.equal(report.columns.some((column) => column.key === "citySite"), false);
  assert.equal(report.summary.find((item) => item.label === "Points used")?.value, 150);
  assert.equal(report.rows[0]?.pointsUsed, 150);
  assert.equal(report.rows[0]?.area, "Baner");
  assert.equal(report.rows[0]?.rewardsDelivered, 1);
});
