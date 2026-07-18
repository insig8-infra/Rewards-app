import assert from "node:assert/strict";
import test from "node:test";
import { createAdminApiClient } from "./adminApi";

test("admin API client centralizes actor headers and keeps QR print body clean", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "STAFF", userId: "staff_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          invoiceId: "invoice_1",
          printedAt: "2026-06-22T00:00:00.000Z",
          expiresAt: "2026-08-06T00:00:00.000Z",
          printedUnits: [],
        }),
        { status: 200 },
      );
    },
  });

  await client.printQr("invoice_1", [{ invoiceLineId: "line_1", quantity: 2 }], "2026-06-22T00:00:00.000Z");

  assert.equal(calls[0]?.url, "http://api.test/admin-web/qr/print");
  assert.equal((calls[0]?.init.headers as Record<string, string>)["x-actor-role"], "STAFF");
  assert.equal((calls[0]?.init.headers as Record<string, string>)["x-actor-user-id"], "staff_user_1");

  const body = JSON.parse(String(calls[0]?.init.body));
  assert.deepEqual(body, {
    invoiceId: "invoice_1",
    lines: [{ invoiceLineId: "line_1", quantity: 2 }],
    now: "2026-06-22T00:00:00.000Z",
  });
});

test("admin API client reads persisted invoice detail and print history with actor headers", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "OWNER", userId: "owner_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify([]), { status: 200 });
    },
  });

  await client.listImportedInvoices();
  await client.getInvoiceDetail("invoice_1");
  await client.getPrintHistory();
  await client.reprintQr("qr_1", "2026-06-22T01:00:00.000Z");
  await client.getDashboard();
  await client.listContractors();
  await client.getContractorDetail("contractor_1");
  await client.listStaff();
  await client.getStaffDetail("staff_1");
  await client.getMyStaffProfile();

  assert.equal(calls[0]?.url, "http://api.test/admin-web/invoices");
  assert.equal(calls[1]?.url, "http://api.test/admin-web/invoices/invoice_1");
  assert.equal(calls[2]?.url, "http://api.test/admin-web/qr/print-history");
  assert.equal(calls[3]?.url, "http://api.test/admin-web/qr/qr_1/reprint");
  assert.deepEqual(JSON.parse(String(calls[3]?.init.body)), {
    now: "2026-06-22T01:00:00.000Z",
  });
  assert.equal(calls[4]?.url, "http://api.test/admin-web/dashboard");
  assert.equal(calls[5]?.url, "http://api.test/admin-web/contractors");
  assert.equal(calls[6]?.url, "http://api.test/admin-web/contractors/contractor_1");
  assert.equal(calls[7]?.url, "http://api.test/admin-web/staff");
  assert.equal(calls[8]?.url, "http://api.test/admin-web/staff/staff_1");
  assert.equal(calls[9]?.url, "http://api.test/admin-web/staff/me");
  assert.equal((calls[9]?.init.headers as Record<string, string>)["x-actor-role"], "OWNER");
  assert.equal((calls[9]?.init.headers as Record<string, string>)["x-actor-user-id"], "owner_user_1");
});

test("admin API client reads BUSY sync status and triggers mock BUSY sync", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "STAFF", userId: "staff_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          latestSyncAt: "2026-07-07T10:30:00.000Z",
          sourceInvoiceCount: 4,
          syncedInvoiceCount: 4,
          importedInvoices: [],
        }),
        { status: 200 },
      );
    },
  });

  await client.getBusySyncStatus();
  await client.syncMockInvoices("2026-07-07T10:30:00.000Z");

  assert.equal(calls[0]?.url, "http://api.test/admin-web/busy/sync-status");
  assert.equal(calls[1]?.url, "http://api.test/admin-web/busy/mock-sync");
  assert.equal(calls[1]?.init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[1]?.init.body)), {
    now: "2026-07-07T10:30:00.000Z",
  });
  assert.equal((calls[1]?.init.headers as Record<string, string>)["x-actor-role"], "STAFF");
});

test("admin API client writes contractor mutations with actor headers", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "OWNER", userId: "owner_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          contractorId: "contractor_1",
          userId: "user_1",
          contractorCode: "CTR-000001",
          name: "Ramesh Electricals",
          mobileNumber: "9876543210",
          status: "ACTIVE",
          totalAccumulatedPoints: 0,
          availablePoints: 0,
          siteCount: 0,
          scanCount: 0,
          rewardClaimCount: 0,
          createdAt: "2026-06-22T00:00:00.000Z",
          sites: [],
        }),
        { status: 200 },
      );
    },
  });

  await client.registerContractor({ name: "Ramesh Electricals", mobileNumber: "9876543210" });
  await client.updateContractorPhoto("contractor_1", { photoUrl: "data:image/jpeg;base64,abc" });
  await client.deactivateContractor("contractor_1");
  await client.reactivateContractor("contractor_1");
  await client.resetContractorMpin("contractor_1");

  assert.equal(calls[0]?.url, "http://api.test/admin-web/contractors");
  assert.equal(calls[0]?.init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), {
    name: "Ramesh Electricals",
    mobileNumber: "9876543210",
  });
  assert.equal(calls[1]?.url, "http://api.test/admin-web/contractors/contractor_1");
  assert.equal(calls[1]?.init.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[1]?.init.body)), {
    photoUrl: "data:image/jpeg;base64,abc",
  });
  assert.equal(calls[2]?.url, "http://api.test/admin-web/contractors/contractor_1/deactivate");
  assert.equal(calls[2]?.init.method, "POST");
  assert.equal(calls[3]?.url, "http://api.test/admin-web/contractors/contractor_1/reactivate");
  assert.equal(calls[4]?.url, "http://api.test/admin-web/contractors/contractor_1/reset-mpin");
  assert.equal((calls[4]?.init.headers as Record<string, string>)["x-actor-role"], "OWNER");
});

test("admin API client writes staff mutations with actor headers", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "OWNER", userId: "owner_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          staff: {
            staffId: "staff_1",
            userId: "user_1",
            name: "Priya Sharma",
            mobileNumber: "9876543210",
            status: "ACTIVE",
            createdAt: "2026-07-01T00:00:00.000Z",
          },
          temporaryPin: "4821",
        }),
        { status: 200 },
      );
    },
  });

  await client.createStaff({ name: "Priya Sharma", mobileNumber: "9876543210", photoUrl: "data:image/jpeg;base64,staff" });
  await client.updateStaffPhoto("staff_1", { photoUrl: "data:image/jpeg;base64,owner" });
  await client.updateMyStaffPhoto({ photoUrl: "data:image/jpeg;base64,self" });
  await client.resetStaffPin("staff_1");
  await client.deactivateStaff("staff_1");
  await client.reactivateStaff("staff_1");

  assert.equal(calls[0]?.url, "http://api.test/admin-web/staff");
  assert.equal(calls[0]?.init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), {
    name: "Priya Sharma",
    mobileNumber: "9876543210",
    photoUrl: "data:image/jpeg;base64,staff",
  });
  assert.equal(calls[1]?.url, "http://api.test/admin-web/staff/staff_1/photo");
  assert.deepEqual(JSON.parse(String(calls[1]?.init.body)), { photoUrl: "data:image/jpeg;base64,owner" });
  assert.equal(calls[2]?.url, "http://api.test/admin-web/staff/me/photo");
  assert.deepEqual(JSON.parse(String(calls[2]?.init.body)), { photoUrl: "data:image/jpeg;base64,self" });
  assert.equal(calls[3]?.url, "http://api.test/admin-web/staff/staff_1/reset-pin");
  assert.equal(calls[4]?.url, "http://api.test/admin-web/staff/staff_1/deactivate");
  assert.equal(calls[5]?.url, "http://api.test/admin-web/staff/staff_1/reactivate");
  assert.equal((calls[5]?.init.headers as Record<string, string>)["x-actor-user-id"], "owner_user_1");
});

test("admin API client writes reward fulfillment calls with OWNER actor headers", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const claimLookup = {
    claim: {
      rewardClaimId: "reward_claim_1",
      claimId: "CLM-123456",
      contractorId: "contractor_1",
      rewardId: "reward-toolbox-basic",
      rewardName: "Premium Toolbox",
      status: "CHOSEN",
      pointsDeducted: 500,
      chosenAt: "2026-07-02T10:00:00.000Z",
    },
    contractor: {
      contractorId: "contractor_1",
      contractorCode: "CON-0001",
      name: "Ramesh Shinde",
      mobileNumber: "9000001001",
      currentTier: "Silver",
      totalAccumulatedPoints: 900,
      pointsAvailable: 400,
    },
    canSendOtp: true,
    canFulfill: true,
  };
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "OWNER", userId: "owner_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      const urlText = String(url);
      const responseBody = urlText.endsWith("/admin-web/rewards/claims") || urlText.endsWith("/admin-web/rewards/claims/history")
        ? [claimLookup]
        : claimLookup;
      return new Response(JSON.stringify(responseBody), { status: 200 });
    },
  });

  await client.listRewardClaims();
  await client.listRewardClaimHistory();
  await client.lookupRewardClaim("CLM-123456");
  await client.sendRewardFulfillmentOtp("CLM-123456");
  await client.fulfillRewardClaim("CLM-123456", { challengeId: "otp_1", otp: "654321" });

  assert.equal(calls[0]?.url, "http://api.test/admin-web/rewards/claims");
  assert.equal(calls[0]?.init.method, undefined);
  assert.equal(calls[1]?.url, "http://api.test/admin-web/rewards/claims/history");
  assert.equal(calls[1]?.init.method, undefined);
  assert.equal(calls[2]?.url, "http://api.test/admin-web/rewards/claims/lookup");
  assert.deepEqual(JSON.parse(String(calls[2]?.init.body)), { claimId: "CLM-123456" });
  assert.equal(calls[3]?.url, "http://api.test/admin-web/rewards/claims/CLM-123456/send-otp");
  assert.equal(calls[3]?.init.method, "POST");
  assert.equal(calls[4]?.url, "http://api.test/admin-web/rewards/claims/CLM-123456/fulfill");
  assert.deepEqual(JSON.parse(String(calls[4]?.init.body)), { challengeId: "otp_1", otp: "654321" });
  assert.equal((calls[4]?.init.headers as Record<string, string>)["x-actor-role"], "OWNER");
  assert.equal((calls[4]?.init.headers as Record<string, string>)["x-actor-user-id"], "owner_user_1");
});

test("admin API client defaults product mode to the admin backend proxy without actor headers", async () => {
  const originalProxyBaseUrl = process.env.NEXT_PUBLIC_ADMIN_PROXY_BASE_URL;
  delete process.env.NEXT_PUBLIC_ADMIN_PROXY_BASE_URL;
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];

  try {
    const client = createAdminApiClient({
      fetcher: async (url, init = {}) => {
        calls.push({ url: String(url), init });
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      },
    });

    await client.getDashboard();

    assert.equal(calls[0]?.url, "/api/admin/backend/admin-web/dashboard");
    assert.equal((calls[0]?.init.headers as Record<string, string>)["x-actor-role"], undefined);
    assert.equal((calls[0]?.init.headers as Record<string, string>)["x-actor-user-id"], undefined);
  } finally {
    if (originalProxyBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_ADMIN_PROXY_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_ADMIN_PROXY_BASE_URL = originalProxyBaseUrl;
    }
  }
});

test("admin API client defaults to the prefixed local API base URL", async () => {
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];

  try {
    const client = createAdminApiClient({
      actor: { role: "OWNER", userId: "owner_user_1" },
      fetcher: async (url, init = {}) => {
        calls.push({ url: String(url), init });
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      },
    });

    await client.getDashboard();

    assert.equal(calls[0]?.url, "http://127.0.0.1:3000/api/admin-web/dashboard");
  } finally {
    if (originalApiBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    }
  }
});

test("admin API client reads reports and exports binary files with OWNER actor headers", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "OWNER", userId: "owner_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      const urlText = String(url);
      if (urlText.endsWith("/export")) {
        return new Response("xlsx-bytes", {
          status: 200,
          headers: {
            "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "content-disposition": 'attachment; filename="qr-print-2026-07-08.xlsx"',
          },
        });
      }
      if (urlText.includes("/landing")) {
        return new Response(
          JSON.stringify({
            resolvedRange: { label: "This Month", from: "2026-07-01T00:00:00.000Z", to: "2026-07-08T00:00:00.000Z", timezone: "Asia/Kolkata" },
            generatedAt: "2026-07-08T10:00:00.000Z",
            cards: [],
            reportShortcuts: [],
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          reportId: "qr-print",
          title: "QR Print Analytics",
          resolvedRange: { label: "This Month", from: "2026-07-01T00:00:00.000Z", to: "2026-07-08T00:00:00.000Z", timezone: "Asia/Kolkata" },
          summary: [],
          columns: [],
          rows: [],
          totalRows: 0,
          page: 1,
          pageSize: 25,
        }),
        { status: 200 },
      );
    },
  });

  await client.getReportsLanding({ rangePreset: "this-month", page: 1, pageSize: 25 });
  await client.getReport("qr-print", { rangePreset: "this-month", qrStatus: "Printed", search: "VR/26", page: 1, pageSize: 25 });
  const download = await client.exportReport("qr-print", "EXCEL", { rangePreset: "this-month", page: 1, pageSize: 25 });

  assert.equal(calls[0]?.url, "http://api.test/admin-web/reports/landing?rangePreset=this-month&page=1&pageSize=25");
  assert.equal(calls[1]?.url, "http://api.test/admin-web/reports/qr-print?rangePreset=this-month&qrStatus=Printed&search=VR%2F26&page=1&pageSize=25");
  assert.equal(calls[2]?.url, "http://api.test/admin-web/reports/qr-print/export");
  assert.equal(calls[2]?.init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[2]?.init.body)), {
    format: "EXCEL",
    filters: { rangePreset: "this-month", page: 1, pageSize: 25 },
  });
  assert.equal((calls[2]?.init.headers as Record<string, string>)["x-actor-role"], "OWNER");
  assert.equal((calls[2]?.init.headers as Record<string, string>)["x-actor-user-id"], "owner_user_1");
  assert.equal(download.fileName, "qr-print-2026-07-08.xlsx");
  assert.equal(download.contentType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
});

test("admin API client manages promotions through OWNER-only endpoints", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const promotion = {
    promotionId: "promo_1",
    title: "NEW SALE IS ON!",
    body: "Earn extra rewards this week.",
    assetUrl: "https://example.test/banner.jpg",
    overlayText: "NEW SALE IS ON!",
    overlayTextColor: "#FFFFFF",
    overlayFontSize: 28,
    overlayFontFamily: "noto-sans-devanagari",
    overlayFontStyle: "bold",
    marqueeEnabled: false,
    targetPersona: "ALL",
    status: "DRAFT",
    createdAt: "2026-07-08T10:00:00.000Z",
    updatedAt: "2026-07-08T10:00:00.000Z",
  };
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "OWNER", userId: "owner_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify(String(url).endsWith("/admin-web/promotions") && init.method === undefined ? [promotion] : promotion), { status: 200 });
    },
  });

  await client.listPromotions();
  await client.createPromotion({
    title: "NEW SALE IS ON!",
    body: "Earn extra rewards this week.",
    assetUrl: "https://example.test/banner.jpg",
    overlayText: "NEW SALE IS ON!",
    overlayTextColor: "#FFFFFF",
    overlayFontSize: 28,
    overlayFontFamily: "hind",
    overlayFontStyle: "bold",
    marqueeEnabled: true,
    targetPersona: "ALL",
  });
  await client.updatePromotion("promo_1", { body: "Updated copy" });
  await client.activatePromotion("promo_1");
  await client.deactivatePromotion("promo_1");

  assert.equal(calls[0]?.url, "http://api.test/admin-web/promotions");
  assert.equal(calls[0]?.init.method, undefined);
  assert.equal(calls[1]?.url, "http://api.test/admin-web/promotions");
  assert.equal(calls[1]?.init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[1]?.init.body)), {
    title: "NEW SALE IS ON!",
    body: "Earn extra rewards this week.",
    assetUrl: "https://example.test/banner.jpg",
    overlayText: "NEW SALE IS ON!",
    overlayTextColor: "#FFFFFF",
    overlayFontSize: 28,
    overlayFontFamily: "hind",
    overlayFontStyle: "bold",
    marqueeEnabled: true,
    targetPersona: "ALL",
  });
  assert.equal(calls[2]?.url, "http://api.test/admin-web/promotions/promo_1");
  assert.equal(calls[2]?.init.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[2]?.init.body)), { body: "Updated copy" });
  assert.equal(calls[3]?.url, "http://api.test/admin-web/promotions/promo_1/activate");
  assert.equal(calls[3]?.init.method, "POST");
  assert.equal(calls[4]?.url, "http://api.test/admin-web/promotions/promo_1/deactivate");
  assert.equal(calls[4]?.init.method, "POST");
  assert.equal((calls[4]?.init.headers as Record<string, string>)["x-actor-role"], "OWNER");
  assert.equal((calls[4]?.init.headers as Record<string, string>)["x-actor-user-id"], "owner_user_1");
});

test("admin API client manages ItemCodes through guarded endpoints", async () => {
  const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
  const itemCode = {
    itemCodeId: "item_code_1",
    tempItemCode: "HAV-LIFE-1.5-RED-90M",
    itemName: "Havells Life Line Plus S3 HRFR 1.5 sq mm Wire Red 90m",
    productCategory: "Wire",
    price: "2850.00",
    fixedPoints: 100,
    finalPoints: 100,
    rewardRuleType: "FIXED",
    ruleSummary: "100 absolute pts",
    status: "IN_USE",
    statusLabel: "In Use",
    busyActive: true,
    sourcePriceField: "Price",
    lastBusySyncAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
  };
  const client = createAdminApiClient({
    apiBaseUrl: "http://api.test",
    actor: { role: "OWNER", userId: "owner_user_1" },
    fetcher: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/admin-web/item-codes/refresh")) {
        return new Response(JSON.stringify({
          sourceCount: 1,
          createdCount: 0,
          updatedCount: 1,
          missingCount: 0,
          attentionCount: 0,
          latestSyncAt: "2026-07-15T00:00:00.000Z",
          itemsNeedingAttention: [],
        }), { status: 200 });
      }
      return new Response(JSON.stringify(init.method === undefined ? [itemCode] : itemCode), { status: 200 });
    },
  });

  await client.listItemCodes({ q: "havells", status: "IN_USE" });
  await client.refreshItemCodes("2026-07-15T00:00:00.000Z");
  await client.updateItemCodeRewardRule("item_code_1", {
    fixedPoints: null,
    percentOfPricePoints: 1,
    now: "2026-07-15T00:00:00.000Z",
  });

  assert.equal(calls[0]?.url, "http://api.test/admin-web/item-codes?q=havells&status=IN_USE");
  assert.equal(calls[0]?.init.method, undefined);
  assert.equal(calls[1]?.url, "http://api.test/admin-web/item-codes/refresh");
  assert.equal(calls[1]?.init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[1]?.init.body)), { now: "2026-07-15T00:00:00.000Z" });
  assert.equal(calls[2]?.url, "http://api.test/admin-web/item-codes/item_code_1/reward-rule");
  assert.equal(calls[2]?.init.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[2]?.init.body)), {
    fixedPoints: null,
    percentOfPricePoints: 1,
    now: "2026-07-15T00:00:00.000Z",
  });
  assert.equal((calls[2]?.init.headers as Record<string, string>)["x-actor-role"], "OWNER");
  assert.equal((calls[2]?.init.headers as Record<string, string>)["x-actor-user-id"], "owner_user_1");
});
