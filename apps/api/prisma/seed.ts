import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "node:crypto";
import { getRuntimeDatabaseUrl } from "../src/env/database-connection.js";
import { loadApiEnv } from "../src/env/load-api-env.js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { uploadRewardImageToStorage } from "../src/storage/supabase-storage.js";

loadApiEnv();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getRuntimeDatabaseUrl(),
  }),
});

async function main(): Promise<void> {
  const owner = await prisma.user.upsert({
    where: { mobileNumber: "9000000001" },
    create: {
      role: "OWNER",
      mobileNumber: "9000000001",
      displayName: "Pratik Shah",
      pinHash: seedAdminPinHash("1234"),
    },
    update: {
      role: "OWNER",
      displayName: "Pratik Shah",
      pinHash: seedAdminPinHash("1234"),
      status: "ACTIVE",
    },
  });

  const staff = await prisma.user.upsert({
    where: { mobileNumber: "9000000002" },
    create: {
      role: "STAFF",
      mobileNumber: "9000000002",
      displayName: "Neha Kulkarni",
      pinHash: seedAdminPinHash("5678"),
      staffProfile: {
        create: {
          pinHash: seedAdminPinHash("5678"),
          createdByOwnerId: owner.id,
        },
      },
    },
    update: {
      role: "STAFF",
      displayName: "Neha Kulkarni",
      pinHash: seedAdminPinHash("5678"),
      status: "ACTIVE",
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: staff.id },
    create: {
      userId: staff.id,
      pinHash: seedAdminPinHash("5678"),
      createdByOwnerId: owner.id,
    },
    update: {
      pinHash: seedAdminPinHash("5678"),
      createdByOwnerId: owner.id,
    },
  });

  const devOwner = await prisma.user.upsert({
    where: { id: "dev-owner-user" },
    create: {
      id: "dev-owner-user",
      role: "OWNER",
      mobileNumber: "9000000091",
      displayName: "Shishir Mehta",
      pinHash: seedAdminPinHash("1111"),
    },
    update: {
      role: "OWNER",
      mobileNumber: "9000000091",
      displayName: "Shishir Mehta",
      pinHash: seedAdminPinHash("1111"),
      status: "ACTIVE",
    },
  });

  const devStaff = await prisma.user.upsert({
    where: { id: "dev-staff-user" },
    create: {
      id: "dev-staff-user",
      role: "STAFF",
      mobileNumber: "9000000092",
      displayName: "Aarti Deshmukh",
      pinHash: seedAdminPinHash("2222"),
      staffProfile: {
        create: {
          pinHash: seedAdminPinHash("2222"),
          createdByOwnerId: devOwner.id,
        },
      },
    },
    update: {
      role: "STAFF",
      mobileNumber: "9000000092",
      displayName: "Aarti Deshmukh",
      pinHash: seedAdminPinHash("2222"),
      status: "ACTIVE",
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: devStaff.id },
    create: {
      userId: devStaff.id,
      pinHash: seedAdminPinHash("2222"),
      createdByOwnerId: devOwner.id,
    },
    update: {
      pinHash: seedAdminPinHash("2222"),
      createdByOwnerId: devOwner.id,
    },
  });

  const contractorUser = await prisma.user.upsert({
    where: { mobileNumber: "9000001001" },
    create: {
      role: "CONTRACTOR",
      mobileNumber: "9000001001",
      displayName: "Ramesh Sharma",
    },
    update: {
      role: "CONTRACTOR",
      displayName: "Ramesh Sharma",
      status: "ACTIVE",
    },
  });

  const contractor = await prisma.contractor.upsert({
    where: { userId: contractorUser.id },
    create: {
      userId: contractorUser.id,
      code: "CON-0001",
      temporaryMpinHash: "seed-temporary-mpin-hash",
      tier: "Gold",
      totalAccumulatedPoints: 1800,
      availablePoints: 1800,
    },
    update: {
      code: "CON-0001",
      temporaryMpinHash: "seed-temporary-mpin-hash",
      tier: "Gold",
      totalAccumulatedPoints: 1800,
      availablePoints: 1800,
      status: "ACTIVE",
    },
  });

  await renameLegacyContractorLabels();

  const rewards = [
    {
      id: "reward-toolbox-basic",
      code: "RW-TOOLBOX-01",
      name: "Premium Toolbox",
      description: "Durable electrician toolbox for daily site work.",
      imageUrl: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=900&q=80",
      cashValueInr: 950,
      pointsRequired: 500,
      totalQuantity: 20,
    },
    {
      id: "reward-wire-stripper-kit",
      code: "RW-WIRE-STRIP-01",
      name: "Wire Stripper Kit",
      description: "Compact hand-tool kit for wiring and finishing jobs.",
      imageUrl: "https://placehold.co/900x600.jpg?text=Wire+Stripper+Kit",
      cashValueInr: 680,
      pointsRequired: 850,
      totalQuantity: 16,
    },
    {
      id: "reward-air-fryer",
      code: "RW-AIRFRYER-01",
      name: "Air Fryer",
      description: "Kitchen appliance reward for high-performing contractors.",
      imageUrl: "https://placehold.co/900x600.jpg?text=Air+Fryer",
      cashValueInr: 3200,
      pointsRequired: 1500,
      totalQuantity: 8,
    },
    {
      id: "reward-cordless-drill",
      code: "RW-DRILL-01",
      name: "Cordless Drill Kit",
      description: "Rechargeable drill kit for professional installation jobs.",
      imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
      cashValueInr: 5600,
      pointsRequired: 4200,
      totalQuantity: 6,
    },
    {
      id: "reward-smart-tv",
      code: "RW-SMART-TV-01",
      name: "Smart TV",
      description: "High-value entertainment reward for consistent performers.",
      imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=80",
      cashValueInr: 18000,
      pointsRequired: 12000,
      totalQuantity: 2,
    },
  ];

  for (const reward of rewards) {
    const seedImage = await resolveSeedRewardImage(reward);
    await prisma.rewardCatalogItem.upsert({
      where: { id: reward.id },
      create: {
        ...reward,
        imageUrl: seedImage.imageUrl,
        tierRequired: null,
        status: "ACTIVE",
      },
      update: {
        code: reward.code,
        name: reward.name,
        description: reward.description,
        imageUrl: seedImage.imageUrl,
        cashValueInr: reward.cashValueInr,
        pointsRequired: reward.pointsRequired,
        totalQuantity: reward.totalQuantity,
        tierRequired: null,
        status: "ACTIVE",
      },
    });
    await prisma.rewardCatalogImage.upsert({
      where: { id: `${reward.id}-primary-image` },
      create: {
        id: `${reward.id}-primary-image`,
        rewardItemId: reward.id,
        imageUrl: seedImage.imageUrl,
        storagePath: seedImage.storagePath,
        altText: reward.name,
        sortOrder: 0,
      },
      update: {
        imageUrl: seedImage.imageUrl,
        storagePath: seedImage.storagePath,
        altText: reward.name,
        sortOrder: 0,
      },
    });
  }

  await seedPromotions();

  await seedRewardClaimScenario({
    userId: "seed-reward-active-user",
    contractorId: "seed-reward-active-contractor",
    mobileNumber: "9000001002",
    displayName: "Mahesh Patil",
    contractorCode: "CON-0002",
    claimId: "CLM-ACTIVE01",
    rewardItemId: "reward-toolbox-basic",
    pointsDeducted: 500,
    totalAccumulatedPoints: 2600,
    availablePointsAfterClaim: 2100,
    chosenAt: new Date("2026-07-07T09:00:00.000Z"),
  });

  await seedRewardClaimScenario({
    userId: "seed-reward-stale-user",
    contractorId: "seed-reward-stale-contractor",
    mobileNumber: "9000001003",
    displayName: "Suresh Pawar",
    contractorCode: "CON-0003",
    claimId: "CLM-STALE01",
    rewardItemId: "reward-wire-stripper-kit",
    pointsDeducted: 850,
    totalAccumulatedPoints: 2500,
    availablePointsAfterClaim: 1650,
    chosenAt: new Date("2026-07-07T09:05:00.000Z"),
  });

  await prisma.site.upsert({
    where: { id: "seed-site-1" },
    create: {
      id: "seed-site-1",
      contractorId: contractor.id,
      clientName: "Joshi Residence",
      flatOrApartmentNo: "B-1202",
      buildingName: "Gulmohar Heights",
      area: "Andheri West",
      city: "Mumbai",
    },
    update: {
      contractorId: contractor.id,
      clientName: "Joshi Residence",
      flatOrApartmentNo: "B-1202",
      buildingName: "Gulmohar Heights",
      area: "Andheri West",
      city: "Mumbai",
      status: "ACTIVE",
    },
  });

  const invoice = await prisma.busyInvoice.upsert({
    where: { externalInvoiceId: "busy-inv-1001" },
    create: {
      externalInvoiceId: "busy-inv-1001",
      invoiceNumber: "INV-1001",
      invoiceDate: new Date("2026-06-20T00:00:00.000Z"),
      customerRef: "Mahavir Electricals Counter",
      totalAmount: "18750.00",
    },
    update: {
      invoiceNumber: "INV-1001",
      invoiceDate: new Date("2026-06-20T00:00:00.000Z"),
      customerRef: "Mahavir Electricals Counter",
      totalAmount: "18750.00",
      status: "IMPORTED",
    },
  });

  const lineInputs = [
    {
      externalLineId: "busy-inv-1001-line-1",
      sku: "HAVELLS-WIRE-1.5SQMM-RED",
      productName: "Havells Copper Wire 1.5 sq mm Red",
      category: "Wire",
      quantity: 6,
      returnedQty: 0,
      pointsPerUnit: 30,
    },
    {
      externalLineId: "busy-inv-1001-line-2",
      sku: "ATOMBERG-RENESA-FAN",
      productName: "Atomberg Renesa Ceiling Fan",
      category: "Fans",
      quantity: 4,
      returnedQty: 1,
      pointsPerUnit: 50,
    },
    {
      externalLineId: "busy-inv-1001-line-3",
      sku: "WIPRO-LED-9W",
      productName: "Wipro LED Bulb 9W Cool White",
      category: "Lights",
      quantity: 10,
      returnedQty: 0,
      pointsPerUnit: 20,
    },
  ];

  let nextUnitIndex = await getNextUnitIndex(invoice.id);
  for (const lineInput of lineInputs) {
    const line = await prisma.busyInvoiceLine.upsert({
      where: {
        invoiceId_externalLineId: {
          invoiceId: invoice.id,
          externalLineId: lineInput.externalLineId,
        },
      },
      create: {
        invoiceId: invoice.id,
        ...lineInput,
      },
      update: lineInput,
    });

    const existingUnits = await prisma.qrUnit.count({
      where: {
        invoiceId: invoice.id,
        invoiceLineId: line.id,
      },
    });

    const missingUnits = Math.max(0, lineInput.quantity - existingUnits);
    for (let offset = 0; offset < missingUnits; offset += 1) {
      await prisma.qrUnit.create({
        data: {
          invoiceId: invoice.id,
          invoiceLineId: line.id,
          unitIndex: nextUnitIndex,
          productSku: lineInput.sku,
          points: lineInput.pointsPerUnit,
          status: "NOT_PRINTED",
        },
      });
      nextUnitIndex += 1;
    }
  }
}

async function seedPromotions(): Promise<void> {
  await prisma.promotion.upsert({
    where: { id: "seed-promotion-monsoon-sale" },
    create: {
      id: "seed-promotion-monsoon-sale",
      title: "NEW SALE IS ON!",
      body: "Earn extra rewards on Havells wires, Wipro bulbs, and Atomberg fans this week.",
      assetUrl: "https://placehold.co/1200x640/00535b/ffffff.jpg?text=Volt+Rewards+Sale",
      assetAltText: "Volt Rewards new sale banner",
      overlayText: "NEW SALE IS ON!",
      overlayTextColor: "#FFFFFF",
      overlayFontSize: 28,
      overlayFontStyle: "bold",
      targetPersona: "ALL",
      status: "ACTIVE",
      endsAt: new Date("2026-12-31T18:29:59.000Z"),
    },
    update: {
      title: "NEW SALE IS ON!",
      body: "Earn extra rewards on Havells wires, Wipro bulbs, and Atomberg fans this week.",
      assetUrl: "https://placehold.co/1200x640/00535b/ffffff.jpg?text=Volt+Rewards+Sale",
      assetAltText: "Volt Rewards new sale banner",
      overlayText: "NEW SALE IS ON!",
      overlayTextColor: "#FFFFFF",
      overlayFontSize: 28,
      overlayFontStyle: "bold",
      targetPersona: "ALL",
      status: "ACTIVE",
      endsAt: new Date("2026-12-31T18:29:59.000Z"),
      archivedAt: null,
    },
  });

  await prisma.promotion.upsert({
    where: { id: "seed-promotion-expired-led-sale" },
    create: {
      id: "seed-promotion-expired-led-sale",
      title: "Expired LED Offer",
      body: "This expired promotion should remain hidden from mobile dashboards.",
      assetUrl: "https://placehold.co/1200x640/d8eee9/00535b.jpg?text=Expired+Offer",
      assetAltText: "Expired offer banner",
      overlayText: "Expired Offer",
      overlayTextColor: "#00535B",
      overlayFontSize: 24,
      overlayFontStyle: "bold",
      targetPersona: "ALL",
      status: "ACTIVE",
      endsAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    update: {
      title: "Expired LED Offer",
      body: "This expired promotion should remain hidden from mobile dashboards.",
      assetUrl: "https://placehold.co/1200x640/d8eee9/00535b.jpg?text=Expired+Offer",
      assetAltText: "Expired offer banner",
      overlayText: "Expired Offer",
      overlayTextColor: "#00535B",
      overlayFontSize: 24,
      overlayFontStyle: "bold",
      targetPersona: "ALL",
      status: "ACTIVE",
      endsAt: new Date("2026-01-01T00:00:00.000Z"),
      archivedAt: null,
    },
  });

  await prisma.promotion.upsert({
    where: { id: "seed-promotion-archived-switch-offer" },
    create: {
      id: "seed-promotion-archived-switch-offer",
      title: "Archived Switch Offer",
      body: "Archived promotions should stay in Admin Web history only.",
      assetUrl: "https://placehold.co/1200x640/f7f4ea/00535b.jpg?text=Archived+Offer",
      assetAltText: "Archived offer banner",
      overlayText: "Archived",
      overlayTextColor: "#00535B",
      overlayFontSize: 22,
      overlayFontStyle: "regular",
      targetPersona: "ALL",
      status: "ARCHIVED",
      archivedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
    update: {
      title: "Archived Switch Offer",
      body: "Archived promotions should stay in Admin Web history only.",
      assetUrl: "https://placehold.co/1200x640/f7f4ea/00535b.jpg?text=Archived+Offer",
      assetAltText: "Archived offer banner",
      overlayText: "Archived",
      overlayTextColor: "#00535B",
      overlayFontSize: 22,
      overlayFontStyle: "regular",
      targetPersona: "ALL",
      status: "ARCHIVED",
      archivedAt: new Date("2026-07-01T00:00:00.000Z"),
      endsAt: null,
    },
  });
}

async function getNextUnitIndex(invoiceId: string): Promise<number> {
  const aggregate = await prisma.qrUnit.aggregate({
    where: { invoiceId },
    _max: { unitIndex: true },
  });

  return (aggregate._max.unitIndex ?? 0) + 1;
}

async function seedRewardClaimScenario(input: {
  readonly userId: string;
  readonly contractorId: string;
  readonly mobileNumber: string;
  readonly displayName: string;
  readonly contractorCode: string;
  readonly claimId: string;
  readonly rewardItemId: string;
  readonly pointsDeducted: number;
  readonly totalAccumulatedPoints: number;
  readonly availablePointsAfterClaim: number;
  readonly chosenAt: Date;
}): Promise<void> {
  const user = await prisma.user.upsert({
    where: { id: input.userId },
    create: {
      id: input.userId,
      role: "CONTRACTOR",
      mobileNumber: input.mobileNumber,
      displayName: input.displayName,
    },
    update: {
      role: "CONTRACTOR",
      mobileNumber: input.mobileNumber,
      displayName: input.displayName,
      status: "ACTIVE",
    },
  });

  const contractor = await prisma.contractor.upsert({
    where: { id: input.contractorId },
    create: {
      id: input.contractorId,
      userId: user.id,
      code: input.contractorCode,
      tier: "Gold",
      totalAccumulatedPoints: input.totalAccumulatedPoints,
      availablePoints: input.availablePointsAfterClaim,
    },
    update: {
      userId: user.id,
      code: input.contractorCode,
      tier: "Gold",
      totalAccumulatedPoints: input.totalAccumulatedPoints,
      availablePoints: input.availablePointsAfterClaim,
      status: "ACTIVE",
    },
  });

  const claim = await prisma.rewardClaim.upsert({
    where: { claimId: input.claimId },
    create: {
      claimId: input.claimId,
      contractorId: contractor.id,
      rewardItemId: input.rewardItemId,
      status: "CHOSEN",
      pointsDeducted: input.pointsDeducted,
      chosenAt: input.chosenAt,
    },
    update: {
      contractorId: contractor.id,
      rewardItemId: input.rewardItemId,
      status: "CHOSEN",
      pointsDeducted: input.pointsDeducted,
      chosenAt: input.chosenAt,
      cancelledAt: null,
      fulfilledAt: null,
      fulfilledByOwnerId: null,
      otpVerifiedAt: null,
    },
  });

  await prisma.pointsLedgerEntry.deleteMany({
    where: { idempotencyKey: `reward-fulfill:${claim.id}` },
  });

  await prisma.pointsLedgerEntry.upsert({
    where: { idempotencyKey: `seed-reward-redeem:${input.claimId}` },
    create: {
      contractorId: contractor.id,
      type: "REWARD_REDEEM",
      pointsDelta: -input.pointsDeducted,
      balanceAfter: input.availablePointsAfterClaim,
      sourceType: "REWARD_CLAIM",
      sourceId: claim.id,
      rewardClaimId: claim.id,
      idempotencyKey: `seed-reward-redeem:${input.claimId}`,
      createdAt: input.chosenAt,
    },
    update: {
      contractorId: contractor.id,
      balanceAfter: input.availablePointsAfterClaim,
      rewardClaimId: claim.id,
    },
  });
}

function rewardImageDataUri(label: string, background: string, accent: string): string {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 720 480">`,
    `<rect width="720" height="480" rx="36" fill="${background}"/>`,
    `<circle cx="612" cy="92" r="86" fill="${accent}" opacity="0.28"/>`,
    `<rect x="96" y="146" width="528" height="210" rx="28" fill="#ffffff" opacity="0.16"/>`,
    `<rect x="160" y="186" width="400" height="34" rx="17" fill="${accent}" opacity="0.92"/>`,
    `<rect x="194" y="252" width="332" height="74" rx="18" fill="#ffffff" opacity="0.88"/>`,
    `<text x="360" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${background}">${escapeSvg(label)}</text>`,
    `</svg>`,
  ].join("");

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeSvg(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface SeedRewardImageSource {
  readonly id: string;
  readonly code: string;
  readonly imageUrl: string;
}

async function resolveSeedRewardImage(reward: SeedRewardImageSource): Promise<{
  readonly imageUrl: string;
  readonly storagePath: string;
}> {
  const primaryImageId = `${reward.id}-primary-image`;
  const existing = await prisma.rewardCatalogImage.findUnique({
    where: { id: primaryImageId },
  });

  if (existing?.imageUrl && existing.storagePath?.startsWith(`rewards/${reward.id}/`)) {
    return {
      imageUrl: existing.imageUrl,
      storagePath: existing.storagePath,
    };
  }

  try {
    const response = await fetch(reward.imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    const bytes = Buffer.from(await response.arrayBuffer());
    const uploaded = await uploadRewardImageToStorage({
      rewardId: reward.id,
      fileName: `${reward.code.toLowerCase()}.jpg`,
      contentType,
      dataBase64: bytes.toString("base64"),
    });
    return uploaded;
  } catch (error) {
    console.warn(`Reward seed image storage fallback for ${reward.code}:`, error);
    return {
      imageUrl: reward.imageUrl,
      storagePath: `seed-online/${reward.code}`,
    };
  }
}

function seedAdminPinHash(pin: string): string {
  return `sha256:admin-pin:${createHash("sha256").update(`volt-rewards:admin-pin:${pin}`).digest("hex")}`;
}

async function renameLegacyContractorLabels(): Promise<void> {
  const legacyUsers = await prisma.user.findMany({
    where: {
      role: "CONTRACTOR",
      OR: [
        { displayName: { contains: "Demo" } },
        { displayName: { contains: "Runtime Gate" } },
        { displayName: { contains: "UAT" } },
        { displayName: { contains: "Isolated" } },
        { displayName: { contains: "Browser Upload" } },
        { displayName: { contains: "UI Path Probe" } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const replacementNames = [
    "Vikram Patil",
    "Amit Verma",
    "Mahesh Yadav",
    "Suresh Pawar",
    "Nitin Jadhav",
    "Rajesh Gupta",
    "Kiran More",
    "Deepak Singh",
    "Arun Nair",
    "Manoj Tiwari",
    "Prakash Shinde",
    "Sanjay Chavan",
  ];

  for (const [index, user] of legacyUsers.entries()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: replacementNames[index % replacementNames.length] ?? "Amit Verma",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
