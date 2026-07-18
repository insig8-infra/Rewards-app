import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnvFile } from "dotenv";
import pg from "pg";

loadRuntimeEnv();

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3000/api").replace(/\/$/, "");
const devOwnerUserId = "dev-owner-user";
const devStaffUserId = "dev-staff-user";

async function main() {
  const databaseUrl = getRequiredDatabaseUrl();
  await verifyApiHealth();
  await verifyDatabase(databaseUrl);
  const contractor = await verifyContractorPersistence(devOwnerUserId);
  await verifyStaffManagement(devOwnerUserId);
  await verifyEndUserAuthSitesAndScanHistory(databaseUrl, devOwnerUserId, contractor);
  await verifyQrPrintPersistence(databaseUrl, devOwnerUserId);
  console.log(
    "Local runtime gate passed: API, database, contractor/staff/site persistence, bearer auth, scan history, and QR actor paths are working.",
  );
}

async function verifyApiHealth() {
  const response = await fetch(`${apiBaseUrl}/health`);
  assert.equal(response.ok, true, `API health failed with ${response.status}`);
  const body = await response.json();
  assert.equal(body.status, "ok");
}

async function verifyDatabase(databaseUrl) {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const result = await pool.query("select 1 as ok");
    assert.equal(result.rows[0]?.ok, 1);
    const ownerResult = await pool.query('select "id" from "User" where "id" = $1 and "role" = $2 limit 1', [
      devOwnerUserId,
      "OWNER",
    ]);
    assert.equal(ownerResult.rows[0]?.id, devOwnerUserId, "Admin Web dev OWNER user was not found.");

    const staffResult = await pool.query('select "id" from "User" where "id" = $1 and "role" = $2 limit 1', [
      devStaffUserId,
      "STAFF",
    ]);
    assert.equal(staffResult.rows[0]?.id, devStaffUserId, "Admin Web dev STAFF user was not found.");
  } finally {
    await pool.end();
  }
}

async function verifyContractorPersistence(ownerUserId) {
  const ownerHeaders = {
    "content-type": "application/json",
    "x-actor-role": "OWNER",
    "x-actor-user-id": ownerUserId,
  };
  const uniqueSuffix = randomUUID().replace(/\D/g, "").padEnd(9, "0").slice(0, 9);
  const mobileNumber = `9${uniqueSuffix}`;
  const photoUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDA1MzViIi8+PHRleHQgeD0iNDAiIHk9IjQ2IiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VlI8L3RleHQ+PC9zdmc+";

  const createResponse = await fetch(`${apiBaseUrl}/admin-web/contractors`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({
      name: "Runtime Gate Contractor",
      mobileNumber,
      photoUrl,
    }),
  });
  await assertOk(createResponse, "Contractor create");
  const created = await createResponse.json();
  assert.equal(created.mobileNumber, mobileNumber);
  assert.equal(created.photoUrl, photoUrl);

  const listResponse = await fetch(`${apiBaseUrl}/admin-web/contractors`, {
    headers: ownerHeaders,
  });
  await assertOk(listResponse, "Contractor list");
  const contractors = await listResponse.json();
  const persisted = contractors.find((contractor) => contractor.contractorId === created.contractorId);
  assert.ok(persisted, "Created contractor was not returned by list endpoint.");
  assert.equal(persisted.photoUrl, photoUrl);

  return created;
}

async function verifyEndUserAuthSitesAndScanHistory(databaseUrl, ownerUserId, contractor) {
  const ownerHeaders = {
    "content-type": "application/json",
    "x-actor-role": "OWNER",
    "x-actor-user-id": ownerUserId,
  };
  const resetResponse = await fetch(`${apiBaseUrl}/admin-web/contractors/${contractor.contractorId}/reset-mpin`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({}),
  });
  await assertOk(resetResponse, "Contractor MPIN reset");
  const reset = await resetResponse.json();
  assert.match(reset.temporaryMpin, /^\d{4}$/);

  const temporaryLoginResponse = await fetch(`${apiBaseUrl}/auth/contractor/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mobileNumber: contractor.mobileNumber,
      mpin: reset.temporaryMpin,
    }),
  });
  await assertOk(temporaryLoginResponse, "Contractor temporary login");
  const temporaryLogin = await temporaryLoginResponse.json();
  assert.equal(temporaryLogin.status, "MPIN_SETUP_REQUIRED");
  assert.equal(temporaryLogin.session.requiresMpinSetup, true);

  const setMpinResponse = await fetch(`${apiBaseUrl}/auth/contractor/set-mpin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      setupSessionToken: temporaryLogin.session.token,
      newMpin: "1357",
      confirmMpin: "1357",
    }),
  });
  await assertOk(setMpinResponse, "Contractor set MPIN");
  const setMpin = await setMpinResponse.json();
  assert.equal(setMpin.status, "AUTHENTICATED");

  const normalLoginResponse = await fetch(`${apiBaseUrl}/auth/contractor/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mobileNumber: contractor.mobileNumber,
      mpin: "1357",
    }),
  });
  await assertOk(normalLoginResponse, "Contractor normal login");
  const normalLogin = await normalLoginResponse.json();
  assert.equal(normalLogin.status, "AUTHENTICATED");
  assert.equal(normalLogin.session.actor.contractorId, contractor.contractorId);

  const changeMpinResponse = await fetch(`${apiBaseUrl}/auth/contractor/change-mpin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionToken: normalLogin.session.token,
      oldMpin: "1357",
      newMpin: "2468",
      confirmMpin: "2468",
    }),
  });
  await assertOk(changeMpinResponse, "Contractor change MPIN");
  const changedMpin = await changeMpinResponse.json();
  assert.equal(changedMpin.status, "AUTHENTICATED");

  const contractorHeaders = {
    "content-type": "application/json",
    authorization: `Bearer ${changedMpin.session.token}`,
  };

  const createSiteResponse = await fetch(`${apiBaseUrl}/contractor/sites`, {
    method: "POST",
    headers: contractorHeaders,
    body: JSON.stringify({
      clientName: " Runtime Gate Site ",
      flatOrApartmentNo: " A-402 ",
      buildingName: " Volt Heights ",
      area: " Baner ",
      city: " Pune ",
    }),
  });
  await assertOk(createSiteResponse, "Contractor site create");
  const site = await createSiteResponse.json();
  assert.equal(site.contractorId, contractor.contractorId);
  assert.equal(site.clientName, "Runtime Gate Site");
  assert.equal(site.status, "ACTIVE");

  const contractorSitesResponse = await fetch(`${apiBaseUrl}/contractor/sites`, {
    headers: contractorHeaders,
  });
  await assertOk(contractorSitesResponse, "Contractor site list");
  const contractorSites = await contractorSitesResponse.json();
  assert.ok(
    contractorSites.some((candidate) => candidate.siteId === site.siteId),
    "Created site was not returned to Contractor.",
  );

  const otpRequestResponse = await fetch(`${apiBaseUrl}/auth/team-member/request-otp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contractorMobileNumber: contractor.mobileNumber,
      teamMemberMobile: "9876543210",
      deviceContext: { platform: "runtime-gate" },
    }),
  });
  await assertOk(otpRequestResponse, "Team Member OTP request");
  const otpRequest = await otpRequestResponse.json();
  assert.equal(otpRequest.status, "OTP_SENT");
  assert.ok(otpRequest.challengeId, "OTP request did not return a challenge id.");
  assert.match(otpRequest.delivery.mockOtp, /^\d{6}$/);

  const otpVerifyResponse = await fetch(`${apiBaseUrl}/auth/team-member/verify-otp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      challengeId: otpRequest.challengeId,
      otp: otpRequest.delivery.mockOtp,
    }),
  });
  await assertOk(otpVerifyResponse, "Team Member OTP verify");
  const otpVerify = await otpVerifyResponse.json();
  assert.equal(otpVerify.status, "AUTHENTICATED");
  assert.equal(otpVerify.session.actor.contractorId, contractor.contractorId);
  assert.equal(otpVerify.session.actor.teamMemberMobile, "9876543210");

  const teamMemberHeaders = {
    "content-type": "application/json",
    authorization: `Bearer ${otpVerify.session.token}`,
  };

  const teamMemberSitesResponse = await fetch(`${apiBaseUrl}/team-member/sites`, {
    headers: teamMemberHeaders,
  });
  await assertOk(teamMemberSitesResponse, "Team Member site list");
  const teamMemberSites = await teamMemberSitesResponse.json();
  assert.ok(
    teamMemberSites.some((candidate) => candidate.siteId === site.siteId),
    "Created active site was not returned to Team Member.",
  );

  const teamMemberCreateDeniedResponse = await fetch(`${apiBaseUrl}/contractor/sites`, {
    method: "POST",
    headers: teamMemberHeaders,
    body: JSON.stringify({ clientName: "Forbidden Team Member Site" }),
  });
  assert.equal(teamMemberCreateDeniedResponse.status, 403, "Team Member should not create sites.");

  const updateSiteResponse = await fetch(`${apiBaseUrl}/contractor/sites/${site.siteId}`, {
    method: "PATCH",
    headers: contractorHeaders,
    body: JSON.stringify({
      clientName: "Runtime Gate Updated Site",
      area: "Aundh",
      city: "Pune",
    }),
  });
  await assertOk(updateSiteResponse, "Contractor site update");
  const updatedSite = await updateSiteResponse.json();
  assert.equal(updatedSite.clientName, "Runtime Gate Updated Site");
  assert.equal(updatedSite.area, "Aundh");

  const printed = await createPrintedRuntimeQr(databaseUrl, ownerUserId);
  const scanResponse = await fetch(`${apiBaseUrl}/scan/qr`, {
    method: "POST",
    headers: teamMemberHeaders,
    body: JSON.stringify({
      token: printed.tokenValue,
      siteId: site.siteId,
      teamMemberSessionId: "runtime-team-member-session",
      deviceContext: { platform: "runtime-gate" },
      now: new Date().toISOString(),
    }),
  });
  await assertOk(scanResponse, "Team Member QR scan");
  const scan = await scanResponse.json();
  assert.equal(scan.contractorId, contractor.contractorId);
  assert.equal(scan.siteId, site.siteId);
  assert.equal(scan.pointsCredited, 10);

  const historyResponse = await fetch(`${apiBaseUrl}/scan/history?limit=10`, {
    headers: teamMemberHeaders,
  });
  await assertOk(historyResponse, "Scan history");
  const history = await historyResponse.json();
  const scanAttempt = history.find((attempt) => attempt.qrUnitId === printed.qrUnitId);
  assert.ok(scanAttempt, "Successful scan was not returned in scan history.");
  assert.equal(scanAttempt.result, "SUCCESS");
  assert.equal(scanAttempt.actorRole, "TEAM_MEMBER");
  assert.equal(scanAttempt.teamMemberMobile, "9876543210");
  assert.equal(scanAttempt.teamMemberSessionId, "runtime-team-member-session");
  assert.equal(scanAttempt.siteId, site.siteId);

  const archiveResponse = await fetch(`${apiBaseUrl}/contractor/sites/${site.siteId}/archive`, {
    method: "POST",
    headers: contractorHeaders,
    body: JSON.stringify({}),
  });
  await assertOk(archiveResponse, "Contractor site archive");
  const archived = await archiveResponse.json();
  assert.equal(archived.status, "ARCHIVED");

  const teamMemberSitesAfterArchiveResponse = await fetch(`${apiBaseUrl}/team-member/sites`, {
    headers: teamMemberHeaders,
  });
  await assertOk(teamMemberSitesAfterArchiveResponse, "Team Member site list after archive");
  const activeTeamMemberSites = await teamMemberSitesAfterArchiveResponse.json();
  assert.equal(
    activeTeamMemberSites.some((candidate) => candidate.siteId === site.siteId),
    false,
    "Archived site should not be returned for Team Member active-site selection.",
  );
}

async function createPrintedRuntimeQr(databaseUrl, ownerUserId) {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const invoiceId = `runtime-scan-invoice-${randomUUID()}`;
  const invoiceLineId = `runtime-scan-line-${randomUUID()}`;
  const qrUnitId = `runtime-scan-qr-${randomUUID()}`;
  const now = new Date().toISOString();

  try {
    await pool.query(
      'insert into "BusyInvoice" ("id", "externalInvoiceId", "invoiceNumber", "invoiceDate", "customerRef", "totalAmount", "updatedAt") values ($1, $2, $3, $4, $5, $6, $7)',
      [
        invoiceId,
        `runtime-scan-external-${randomUUID()}`,
        `RT-SCAN-${Date.now()}`,
        now,
        "Runtime Scan Customer",
        "100.00",
        now,
      ],
    );
    await pool.query(
      'insert into "BusyInvoiceLine" ("id", "invoiceId", "externalLineId", "sku", "productName", "category", "quantity", "returnedQty", "pointsPerUnit") values ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        invoiceLineId,
        invoiceId,
        `runtime-scan-line-${randomUUID()}`,
        "RUNTIME-SCAN-WIRE-1",
        "Runtime Gate Scan Wire",
        "Wire",
        1,
        0,
        10,
      ],
    );
    await pool.query(
      'insert into "QrUnit" ("id", "invoiceId", "invoiceLineId", "unitIndex", "productSku", "points", "status", "updatedAt") values ($1, $2, $3, $4, $5, $6, $7, $8)',
      [qrUnitId, invoiceId, invoiceLineId, 1, "RUNTIME-SCAN-WIRE-1", 10, "NOT_PRINTED", now],
    );
  } finally {
    await pool.end();
  }

  const printResponse = await fetch(`${apiBaseUrl}/admin-web/qr/print`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-actor-role": "OWNER",
      "x-actor-user-id": ownerUserId,
    },
    body: JSON.stringify({
      invoiceId,
      lines: [{ invoiceLineId, quantity: 1 }],
      now,
    }),
  });
  await assertOk(printResponse, "Runtime scan QR print");
  const printed = await printResponse.json();
  const printedUnit = printed.printedUnits[0];
  assert.equal(printedUnit?.qrUnitId, qrUnitId);

  return {
    invoiceId,
    invoiceLineId,
    qrUnitId,
    tokenValue: printedUnit.tokenValue,
  };
}

async function verifyStaffManagement(ownerUserId) {
  const ownerHeaders = {
    "content-type": "application/json",
    "x-actor-role": "OWNER",
    "x-actor-user-id": ownerUserId,
  };
  const staffHeaders = {
    "content-type": "application/json",
    "x-actor-role": "STAFF",
    "x-actor-user-id": devStaffUserId,
  };
  const uniqueSuffix = randomUUID().replace(/\D/g, "").padEnd(9, "0").slice(0, 9);
  const mobileNumber = `8${uniqueSuffix}`;

  const deniedResponse = await fetch(`${apiBaseUrl}/admin-web/staff`, {
    headers: staffHeaders,
  });
  assert.equal(deniedResponse.status, 403, "STAFF should be forbidden from staff management.");

  const createResponse = await fetch(`${apiBaseUrl}/admin-web/staff`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({
      name: "Runtime Gate Staff",
      mobileNumber,
    }),
  });
  await assertOk(createResponse, "Staff create");
  const created = await createResponse.json();
  assert.equal(created.staff.mobileNumber, mobileNumber);
  assert.match(created.temporaryPin, /^\d{4}$/);

  const listResponse = await fetch(`${apiBaseUrl}/admin-web/staff`, {
    headers: ownerHeaders,
  });
  await assertOk(listResponse, "Staff list");
  const staff = await listResponse.json();
  const persisted = staff.find((staffMember) => staffMember.staffId === created.staff.staffId);
  assert.ok(persisted, "Created staff was not returned by list endpoint.");
  assert.equal(persisted.mobileNumber, mobileNumber);
  assert.equal(persisted.temporaryPin, undefined, "Staff list must not expose temporary PIN.");

  const resetResponse = await fetch(`${apiBaseUrl}/admin-web/staff/${created.staff.staffId}/reset-pin`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({}),
  });
  await assertOk(resetResponse, "Staff PIN reset");
  const reset = await resetResponse.json();
  assert.match(reset.temporaryPin, /^\d{4}$/);

  const deactivateResponse = await fetch(`${apiBaseUrl}/admin-web/staff/${created.staff.staffId}/deactivate`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({}),
  });
  await assertOk(deactivateResponse, "Staff deactivate");
  const deactivated = await deactivateResponse.json();
  assert.equal(deactivated.status, "DEACTIVATED");

  const reactivateResponse = await fetch(`${apiBaseUrl}/admin-web/staff/${created.staff.staffId}/reactivate`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({}),
  });
  await assertOk(reactivateResponse, "Staff reactivate");
  const reactivated = await reactivateResponse.json();
  assert.equal(reactivated.status, "ACTIVE");
}

async function verifyQrPrintPersistence(databaseUrl, ownerUserId) {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const invoiceId = `runtime-invoice-${randomUUID()}`;
  const invoiceLineId = `runtime-line-${randomUUID()}`;
  const qrUnitId = `runtime-qr-${randomUUID()}`;
  const now = new Date().toISOString();

  try {
    await pool.query(
      'insert into "BusyInvoice" ("id", "externalInvoiceId", "invoiceNumber", "invoiceDate", "customerRef", "totalAmount", "updatedAt") values ($1, $2, $3, $4, $5, $6, $7)',
      [
        invoiceId,
        `runtime-external-${randomUUID()}`,
        `RT-${Date.now()}`,
        now,
        "Runtime Gate Customer",
        "100.00",
        now,
      ],
    );
    await pool.query(
      'insert into "BusyInvoiceLine" ("id", "invoiceId", "externalLineId", "sku", "productName", "category", "quantity", "returnedQty", "pointsPerUnit") values ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        invoiceLineId,
        invoiceId,
        `runtime-line-${randomUUID()}`,
        "RUNTIME-WIRE-1",
        "Runtime Gate Wire",
        "Wire",
        1,
        0,
        10,
      ],
    );
    await pool.query(
      'insert into "QrUnit" ("id", "invoiceId", "invoiceLineId", "unitIndex", "productSku", "points", "status", "updatedAt") values ($1, $2, $3, $4, $5, $6, $7, $8)',
      [qrUnitId, invoiceId, invoiceLineId, 1, "RUNTIME-WIRE-1", 10, "NOT_PRINTED", now],
    );
  } finally {
    await pool.end();
  }

  const printResponse = await fetch(`${apiBaseUrl}/admin-web/qr/print`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-actor-role": "OWNER",
      "x-actor-user-id": ownerUserId,
    },
    body: JSON.stringify({
      invoiceId,
      lines: [{ invoiceLineId, quantity: 1 }],
      now,
    }),
  });
  await assertOk(printResponse, "QR print");
  const printed = await printResponse.json();
  assert.equal(printed.printedUnits.length, 1);
  assert.equal(printed.printedUnits[0]?.qrUnitId, qrUnitId);

  const verifyPool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const result = await verifyPool.query('select "status", "printedByUserId" from "QrUnit" where "id" = $1', [
      qrUnitId,
    ]);
    assert.equal(result.rows[0]?.status, "PRINTED_UNCLAIMED");
    assert.equal(result.rows[0]?.printedByUserId, ownerUserId);
  } finally {
    await verifyPool.end();
  }
}

async function assertOk(response, label) {
  if (response.ok) {
    return;
  }

  throw new Error(`${label} failed with ${response.status}: ${await response.text()}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

function loadRuntimeEnv() {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), ".env.local"),
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }

    loadEnvFile({
      path: envPath,
      override: envPath.endsWith(".env.local"),
    });
  }

  applySupabaseDatabasePassword();
}

function applySupabaseDatabasePassword() {
  const databaseUrl = process.env.DATABASE_URL;
  const databasePassword = process.env.SUPABASE_DATABASE_PASSWORD;

  if (!databaseUrl || !databasePassword) {
    return;
  }

  const parsedUrl = new URL(databaseUrl);
  parsedUrl.password = databasePassword;
  process.env.DATABASE_URL = parsedUrl.toString();
}

function getRequiredDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  throw new Error(
    "DATABASE_URL is required for the runtime gate. Supabase API keys cannot be used as PostgreSQL connection strings.",
  );
}
