import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnvFile } from "dotenv";
import pg from "pg";

loadRuntimeEnv();

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3000/api").replace(/\/$/, "");
const ownerUserId = "dev-owner-user";
const contractorMobile = "9000001001";
const teamMemberMobile = "9000011111";

const qrDemoLines = [
  { sku: "WIPRO-LED-BULB-DEMO", productName: "Wipro LED Bulb", category: "Lights", points: 50 },
  { sku: "HAVELLS-WIRE-DEMO", productName: "Havells Wire Bundle", category: "Wire", points: 120 },
  { sku: "ANCHOR-SWITCH-DEMO", productName: "Anchor Modular Switch", category: "Switches", points: 200 },
  { sku: "ATOMBERG-FAN-DEMO", productName: "Atomberg Ceiling Fan", category: "Fans", points: 250 },
  { sku: "POLYCAB-CABLE-DEMO", productName: "Polycab Cable Roll", category: "Cable", points: 300 },
];

async function main() {
  await assertApiHealthy();

  const databaseUrl = getRequiredDatabaseUrl();
  const pool = new pg.Pool({ connectionString: databaseUrl });

  let demoContext;
  try {
    demoContext = await prepareDatabase(pool);
  } finally {
    await pool.end();
  }

  const printedTokens = await printQrTokens(demoContext);
  const teamOtp = await requestTeamMemberOtp();

  console.log(
    JSON.stringify(
      {
        urls: {
          adminWeb: "http://127.0.0.1:3001",
          adminMobile: "http://127.0.0.1:3003",
          endUserMobile: "http://127.0.0.1:3002",
          apiHealth: `${apiBaseUrl}/health`,
        },
        logins: {
          owner: {
            app: "Admin Web and Admin Mobile",
            mobileNumber: "9000000091",
            pin: "1111",
            name: "Shishir Mehta",
          },
          contractor: {
            app: "End-user mobile app",
            mobileNumber: contractorMobile,
            mpin: "1234",
            name: demoContext.contractorName,
          },
          teamMember: {
            app: "End-user mobile app",
            contractorMobileNumber: contractorMobile,
            teamMemberMobile,
            otp: teamOtp.mockOtp,
            challengeId: teamOtp.challengeId,
            note: "Use Team Member login, request OTP, then enter this dev OTP if the UI does not show it.",
          },
        },
        rewardDemo: {
          rewardName: demoContext.reward.name,
          currentAvailablePoints: demoContext.contractorAvailablePoints,
          pointsRequired: demoContext.reward.pointsRequired,
          pointsAway: 50,
          unlockToken: printedTokens[0],
          instruction: "Scan the first 50-point QR token and tap Add to account; this reward should then become Get Now.",
        },
        qrTokens: printedTokens,
        activeSite: demoContext.site,
      },
      null,
      2,
    ),
  );
}

async function prepareDatabase(pool) {
  const now = new Date();
  const contractor = await findContractor(pool);
  const site = await ensureActiveSite(pool, contractor.id, now);
  await clearActiveDemoCart(pool, contractor.id, now);
  const reward = await ensureRewardFiftyPointsAway(pool, contractor.id, contractor.availablePoints, now);
  await ensureDemoItemCodes(pool, now);
  const invoice = await createDemoInvoice(pool, now);

  return {
    contractorId: contractor.id,
    contractorName: contractor.name,
    contractorAvailablePoints: contractor.availablePoints,
    site,
    reward,
    invoice,
  };
}

async function findContractor(pool) {
  const result = await pool.query(
    `select c."id", c."availablePoints", u."displayName" as "name"
       from "Contractor" c
       join "User" u on u."id" = c."userId"
      where u."mobileNumber" = $1 and c."status" = 'ACTIVE'
      limit 1`,
    [contractorMobile],
  );
  const contractor = result.rows[0];
  assert.ok(contractor, `Active contractor ${contractorMobile} was not found.`);
  return {
    id: contractor.id,
    availablePoints: Number(contractor.availablePoints),
    name: contractor.name,
  };
}

async function ensureDemoItemCodes(pool, now) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const line of qrDemoLines) {
      await client.query(
        `insert into "ItemCode"
           ("id", "tempItemCode", "itemName", "productCategory", "price", "fixedPoints", "percentOfPricePoints", "status", "busyActive", "lastBusySyncAt", "missingSince", "sourcePriceField", "rawSource", "createdAt", "updatedAt")
         values ($1, $2, $3, $4, $5, $6, null, 'IN_USE', true, $7, null, 'Price', $8, $7, $7)
         on conflict ("tempItemCode") do update
           set "itemName" = excluded."itemName",
               "productCategory" = excluded."productCategory",
               "price" = excluded."price",
               "fixedPoints" = excluded."fixedPoints",
               "percentOfPricePoints" = null,
               "status" = 'IN_USE',
               "busyActive" = true,
               "lastBusySyncAt" = excluded."lastBusySyncAt",
               "missingSince" = null,
               "sourcePriceField" = 'Price',
               "rawSource" = excluded."rawSource",
               "updatedAt" = excluded."updatedAt"`,
        [
          `client-demo-item-code-${line.sku}`,
          line.sku,
          line.productName,
          line.category,
          line.points * 10,
          line.points,
          now,
          JSON.stringify({
            source: "client-demo",
            tmpItemCode: line.sku,
            itemName: line.productName,
            price: line.points * 10,
          }),
        ],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureActiveSite(pool, contractorId, now) {
  const existing = await pool.query(
    `select "id", "clientName", "flatOrApartmentNo", "buildingName", "area", "city"
       from "Site"
      where "contractorId" = $1 and "status" = 'ACTIVE'
      order by "createdAt" asc
      limit 1`,
    [contractorId],
  );
  const current = existing.rows[0];
  if (current) {
    return toSiteSummary(current);
  }

  const siteId = `site-client-demo-${randomUUID()}`;
  const created = await pool.query(
    `insert into "Site"
       ("id", "contractorId", "clientName", "flatOrApartmentNo", "buildingName", "area", "city", "status", "createdAt", "updatedAt")
     values ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, $8)
     returning "id", "clientName", "flatOrApartmentNo", "buildingName", "area", "city"`,
    [siteId, contractorId, "Agarwal Residence", "402", "Shivneri Heights", "Baner", "Pune", now],
  );
  return toSiteSummary(created.rows[0]);
}

async function clearActiveDemoCart(pool, contractorId, now) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const activeCarts = await client.query(
      `select "id" from "ScanCart" where "contractorId" = $1 and "status" = 'ACTIVE'`,
      [contractorId],
    );
    const cartIds = activeCarts.rows.map((row) => row.id);
    if (cartIds.length > 0) {
      await client.query(
        `update "QrUnit"
            set "status" = 'PRINTED_UNCLAIMED',
                "reservedAt" = null,
                "reservedCartId" = null,
                "updatedAt" = $2
          where "reservedCartId" = any($1) and "status" = 'RESERVED_IN_CART'`,
        [cartIds, now],
      );
      await client.query(
        `update "ScanCartItem"
            set "status" = 'INVALIDATED',
                "invalidatedAt" = $2,
                "invalidationReason" = 'Client demo reset',
                "updatedAt" = $2
          where "scanCartId" = any($1) and "status" = 'RESERVED'`,
        [cartIds, now],
      );
      await client.query(
        `update "ScanCart"
            set "status" = 'INVALIDATED',
                "lastActivityAt" = $2
          where "id" = any($1)`,
        [cartIds, now],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureRewardFiftyPointsAway(pool, contractorId, availablePoints, now) {
  const rewardId = "reward-client-demo-50-away";
  const pointsRequired = availablePoints + 50;
  const imageUrl = "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80";
  const client = await pool.connect();

  try {
    await client.query("begin");
    const upserted = await client.query(
      `insert into "RewardCatalogItem"
         ("id", "code", "name", "description", "pointsRequired", "tierRequired", "imageUrl", "cashValueInr", "totalQuantity", "status", "createdAt", "updatedAt")
       values ($1, 'RW-DEMO-50-AWAY', 'Cordless Drill Kit', 'Rechargeable drill kit for professional installation jobs.', $2, null, $3, 5600, 8, 'ACTIVE', $4, $4)
       on conflict ("id") do update
         set "pointsRequired" = excluded."pointsRequired",
             "imageUrl" = excluded."imageUrl",
             "totalQuantity" = 8,
             "status" = 'ACTIVE',
             "updatedAt" = excluded."updatedAt"
       returning "id", "name", "pointsRequired"`,
      [rewardId, pointsRequired, imageUrl, now],
    );

    await client.query(
      `insert into "RewardCatalogImage"
         ("id", "rewardItemId", "imageUrl", "storagePath", "altText", "sortOrder", "createdAt", "updatedAt")
       values ($1, $2, $3, 'seed/client-demo/cordless-drill.jpg', 'Cordless Drill Kit', 0, $4, $4)
       on conflict ("id") do update
         set "imageUrl" = excluded."imageUrl",
             "altText" = excluded."altText",
             "updatedAt" = excluded."updatedAt"`,
      ["reward-client-demo-50-away-image-1", rewardId, imageUrl, now],
    );

    await client.query(
      `update "RewardClaim"
          set "status" = 'CANCELLED_BY_CONTRACTOR',
              "cancelledAt" = coalesce("cancelledAt", $3)
        where "rewardItemId" = $1
          and "contractorId" = $2
          and "status" = 'CHOSEN'`,
      [rewardId, contractorId, now],
    );

    await client.query("commit");
    return {
      id: upserted.rows[0].id,
      name: upserted.rows[0].name,
      pointsRequired: Number(upserted.rows[0].pointsRequired),
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function createDemoInvoice(pool, now) {
  const suffix = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const invoiceId = `client-demo-invoice-${suffix}-${randomUUID()}`;
  const invoiceNumber = `VR/DEMO/${suffix}`;
  const totalAmount = qrDemoLines.reduce((sum, line) => sum + line.points * 10, 0);
  const lineContexts = [];

  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into "BusyInvoice"
         ("id", "externalInvoiceId", "invoiceNumber", "invoiceDate", "customerRef", "totalAmount", "rawSource", "status", "importedAt", "updatedAt")
       values ($1, $2, $3, $4, 'Client Demo Walk-in', $5, $6, 'IMPORTED', $4, $4)`,
      [
        invoiceId,
        `busy-client-demo-${suffix}-${randomUUID()}`,
        invoiceNumber,
        now,
        totalAmount,
        JSON.stringify({
          source: "client-demo",
          gst: "18%",
          note: "Prepared for live QR scan workflow demonstration.",
        }),
      ],
    );

    for (const [index, line] of qrDemoLines.entries()) {
      const invoiceLineId = `client-demo-line-${index + 1}-${randomUUID()}`;
      const qrUnitId = `client-demo-qr-${index + 1}-${randomUUID()}`;
      const externalLineId = `client-demo-line-${suffix}-${index + 1}`;
      await client.query(
        `insert into "BusyInvoiceLine"
           ("id", "invoiceId", "externalLineId", "sku", "productName", "category", "quantity", "returnedQty", "pointsPerUnit", "rawSource")
         values ($1, $2, $3, $4, $5, $6, 1, 0, $7, $8)`,
        [
          invoiceLineId,
          invoiceId,
          externalLineId,
          line.sku,
          line.productName,
          line.category,
          line.points,
          JSON.stringify({ source: "client-demo", lineIndex: index + 1 }),
        ],
      );
      await client.query(
        `insert into "QrUnit"
           ("id", "invoiceId", "invoiceLineId", "unitIndex", "productSku", "points", "status", "createdAt", "updatedAt")
         values ($1, $2, $3, $4, $5, $6, 'NOT_PRINTED', $7, $7)`,
        [qrUnitId, invoiceId, invoiceLineId, index + 1, line.sku, line.points, now],
      );
      lineContexts.push({ ...line, invoiceLineId, qrUnitId });
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  return {
    id: invoiceId,
    invoiceNumber,
    lines: lineContexts,
  };
}

async function printQrTokens(demoContext) {
  const response = await fetch(`${apiBaseUrl}/admin-web/qr/print`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-actor-role": "OWNER",
      "x-actor-user-id": ownerUserId,
    },
    body: JSON.stringify({
      invoiceId: demoContext.invoice.id,
      lines: demoContext.invoice.lines.map((line) => ({ invoiceLineId: line.invoiceLineId, quantity: 1 })),
      now: new Date().toISOString(),
    }),
  });
  await assertOk(response, "QR print");
  const printed = await response.json();
  const byQrUnitId = new Map(printed.printedUnits.map((unit) => [unit.qrUnitId, unit]));
  return demoContext.invoice.lines.map((line, index) => {
    const printedUnit = byQrUnitId.get(line.qrUnitId);
    assert.ok(printedUnit?.tokenValue, `Printed token missing for ${line.productName}`);
    return {
      label: `QR ${index + 1}`,
      token: printedUnit.tokenValue,
      points: line.points,
      product: line.productName,
      invoiceNumber: demoContext.invoice.invoiceNumber,
    };
  });
}

async function requestTeamMemberOtp() {
  const response = await fetch(`${apiBaseUrl}/auth/team-member/request-otp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contractorMobileNumber: contractorMobile,
      teamMemberMobile,
      deviceContext: { surface: "client-demo" },
    }),
  });
  await assertOk(response, "Team Member OTP request");
  const body = await response.json();
  assert.equal(body.status, "OTP_SENT");
  return {
    challengeId: body.challengeId,
    mockOtp: body.delivery?.mockOtp,
  };
}

async function assertApiHealthy() {
  const response = await fetch(`${apiBaseUrl}/health`);
  await assertOk(response, "API health");
}

async function assertOk(response, label) {
  if (response.ok) {
    return;
  }

  throw new Error(`${label} failed with ${response.status}: ${await response.text()}`);
}

function toSiteSummary(row) {
  return {
    siteId: row.id,
    clientName: row.clientName,
    flatOrApartmentNo: row.flatOrApartmentNo,
    buildingName: row.buildingName,
    area: row.area,
    city: row.city,
  };
}

function loadRuntimeEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), ".env.local")];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }

    loadEnvFile({
      path: envPath,
      override: envPath.endsWith(".env.local"),
    });
  }

  applySupabaseDatabaseConnection();
}

function applySupabaseDatabaseConnection() {
  const supabaseDatabaseUrl = buildSupabaseDatabaseUrl();
  if (supabaseDatabaseUrl) {
    process.env.DATABASE_URL = supabaseDatabaseUrl;
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const databasePassword = process.env.SUPABASE_DATABASE_PASSWORD;

  if (!databaseUrl || !databasePassword) {
    return;
  }

  const parsedUrl = new URL(databaseUrl);
  parsedUrl.password = databasePassword;
  process.env.DATABASE_URL = parsedUrl.toString();
}

function buildSupabaseDatabaseUrl() {
  const host = process.env.SUPABASE_POOLER_HOST;
  const user = process.env.SUPABASE_DATABASE_USER;
  const password = process.env.SUPABASE_DATABASE_PASSWORD;
  const databaseName = process.env.SUPABASE_DATABASE_NAME ?? "postgres";
  const port = process.env.SUPABASE_DATABASE_PORT ?? "5432";
  const sslMode = process.env.SUPABASE_DATABASE_SSLMODE ?? "require";
  const useLibpqCompat = process.env.SUPABASE_DATABASE_USE_LIBPQ_COMPAT === "true";

  if (!host || !user || !password) {
    return undefined;
  }

  const url = new URL(`postgresql://placeholder:placeholder@${host}:${port}/${databaseName}`);
  url.username = user;
  url.password = password;
  if (sslMode) {
    url.searchParams.set("sslmode", sslMode);
  }
  if (useLibpqCompat) {
    url.searchParams.set("uselibpqcompat", "true");
  }
  return url.toString();
}

function getRequiredDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  throw new Error("DATABASE_URL is required to prepare client demo data.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
