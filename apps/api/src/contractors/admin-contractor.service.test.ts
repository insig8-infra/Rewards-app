import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import {
  AdminContractorService,
} from "./admin-contractor.service.js";
import type {
  AdminContractorDetail,
  AdminContractorRepository,
  AdminContractorSummary,
  AdminContractorWriteInput,
} from "./admin-contractor.repository.js";

const ownerActor: AuthenticatedActor = { role: "OWNER", userId: "owner_user_1" };
const existingContractor = makeContractor({
  contractorId: "contractor_existing",
  mobileNumber: "9876543210",
});

test("AdminContractorService normalizes registration and blocks duplicate contractor mobiles", async () => {
  const seenCreates: AdminContractorWriteInput[] = [];
  const service = new AdminContractorService({
    listContractors: () => Promise.resolve([]),
    getContractorDetail: () => Promise.resolve(null),
    findMobileRegistration: (mobileNumber) =>
      Promise.resolve(
        mobileNumber === "9876543210"
          ? { userId: "user_existing", role: "CONTRACTOR", contractor: existingContractor }
          : null,
      ),
    createContractor: (input) => {
      seenCreates.push(input);
      return Promise.resolve(makeContractor({ mobileNumber: input.mobileNumber, name: input.name }));
    },
    updateContractor: () => Promise.resolve(existingContractor),
    deactivateContractor: () => Promise.resolve(existingContractor),
    reactivateContractor: () => Promise.resolve(existingContractor),
  } as AdminContractorRepository);

  await assert.rejects(
    service.registerContractor({ name: "Existing", mobileNumber: "9876543210" }, ownerActor),
    (error) => error instanceof ConflictException,
  );

  await service.registerContractor({ name: "  New   Contractor ", mobileNumber: "+91 91234 56789" }, ownerActor);

  assert.deepEqual(seenCreates, [{ name: "New Contractor", mobileNumber: "9123456789" }]);
});

test("AdminContractorService rejects invalid contractor registration input", async () => {
  const service = new AdminContractorService({
    listContractors: () => Promise.resolve([]),
    getContractorDetail: () => Promise.resolve(null),
    findMobileRegistration: () => Promise.resolve(null),
    createContractor: () => Promise.resolve(existingContractor),
    updateContractor: () => Promise.resolve(existingContractor),
    deactivateContractor: () => Promise.resolve(existingContractor),
    reactivateContractor: () => Promise.resolve(existingContractor),
  } as AdminContractorRepository);

  await assert.rejects(
    service.registerContractor({ name: "Ramesh", mobileNumber: "12345" }, ownerActor),
    (error) => error instanceof BadRequestException,
  );
});

test("AdminContractorService returns NotFoundException for missing contractor detail", async () => {
  const service = new AdminContractorService({
    listContractors: () => Promise.resolve([]),
    getContractorDetail: () => Promise.resolve(null),
    findMobileRegistration: () => Promise.resolve(null),
    createContractor: () => Promise.resolve(existingContractor),
    updateContractor: () => Promise.resolve(existingContractor),
    deactivateContractor: () => Promise.resolve(existingContractor),
    reactivateContractor: () => Promise.resolve(existingContractor),
  } as AdminContractorRepository);

  await assert.rejects(
    service.getContractorDetail("missing_contractor"),
    (error) => error instanceof NotFoundException,
  );
});

test("AdminContractorService rejects contractor identity updates after registration", async () => {
  const service = new AdminContractorService({
    listContractors: () => Promise.resolve([]),
    getContractorDetail: () =>
      Promise.resolve(makeContractor({ contractorId: "contractor_current", mobileNumber: "9123456789" })),
    findMobileRegistration: () => Promise.resolve(null),
    createContractor: () => Promise.resolve(existingContractor),
    updateContractor: () => Promise.resolve(existingContractor),
    deactivateContractor: () => Promise.resolve(existingContractor),
    reactivateContractor: () => Promise.resolve(existingContractor),
  } as AdminContractorRepository);

  await assert.rejects(
    service.updateContractor("contractor_current", { mobileNumber: "9876543210" }, ownerActor),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    service.updateContractor("contractor_current", { name: "Changed Name" }, ownerActor),
    (error) => error instanceof BadRequestException,
  );
});

test("AdminContractorService allows photo-only updates", async () => {
  const seenPhotoUrls: Array<string | null | undefined> = [];
  const service = new AdminContractorService({
    listContractors: () => Promise.resolve([]),
    getContractorDetail: () => Promise.resolve(existingContractor),
    findMobileRegistration: () => Promise.resolve(null),
    createContractor: () => Promise.resolve(existingContractor),
    updateContractor: (_contractorId, input) => {
      seenPhotoUrls.push(input.photoUrl);
      return Promise.resolve(makeContractor(input.photoUrl ? { photoUrl: input.photoUrl } : {}));
    },
    deactivateContractor: () => Promise.resolve(existingContractor),
    reactivateContractor: () => Promise.resolve(existingContractor),
  } as AdminContractorRepository);

  await service.updateContractor("contractor_existing", { photoUrl: "  data:image/jpeg;base64,abc  " }, ownerActor);
  await service.updateContractor("contractor_existing", { photoUrl: "" }, ownerActor);

  assert.deepEqual(seenPhotoUrls, ["data:image/jpeg;base64,abc", null]);
});

test("AdminContractorService allows association note updates and clears blank notes", async () => {
  const seenNotes: Array<string | null | undefined> = [];
  const service = new AdminContractorService({
    listContractors: () => Promise.resolve([]),
    getContractorDetail: () => Promise.resolve(existingContractor),
    findMobileRegistration: () => Promise.resolve(null),
    createContractor: () => Promise.resolve(existingContractor),
    updateContractor: (_contractorId, input) => {
      seenNotes.push(input.belongsToNote);
      return Promise.resolve(makeContractor(input.belongsToNote ? { belongsToNote: input.belongsToNote } : {}));
    },
    deactivateContractor: () => Promise.resolve(existingContractor),
    reactivateContractor: () => Promise.resolve(existingContractor),
  } as AdminContractorRepository);

  await service.updateContractor("contractor_existing", { belongsToNote: "  Pune West dealer group  " }, ownerActor);
  await service.updateContractor("contractor_existing", { belongsToNote: "" }, ownerActor);

  assert.deepEqual(seenNotes, ["Pune West dealer group", null]);
});

test("AdminContractorService deactivates and reactivates contractors with state guards", async () => {
  const deactivated = makeContractor({ status: "DEACTIVATED", deactivatedAt: new Date("2026-07-01T00:00:00.000Z") });
  const service = new AdminContractorService({
    listContractors: () => Promise.resolve([]),
    getContractorDetail: (contractorId) => Promise.resolve(contractorId === "inactive_contractor" ? deactivated : existingContractor),
    findMobileRegistration: () => Promise.resolve(null),
    createContractor: () => Promise.resolve(existingContractor),
    updateContractor: () => Promise.resolve(existingContractor),
    deactivateContractor: () => Promise.resolve(deactivated),
    reactivateContractor: () => Promise.resolve(existingContractor),
  } as AdminContractorRepository);

  assert.equal((await service.deactivateContractor("contractor_existing", ownerActor)).status, "DEACTIVATED");
  assert.equal((await service.reactivateContractor("inactive_contractor", ownerActor)).status, "ACTIVE");

  await assert.rejects(
    service.deactivateContractor("inactive_contractor", ownerActor),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    service.reactivateContractor("contractor_existing", ownerActor),
    (error) => error instanceof BadRequestException,
  );
});

function makeContractor(
  overrides: Partial<AdminContractorDetail> = {},
): AdminContractorDetail {
  return {
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
    successfulScanCount: 0,
    scannedBusinessInr: "0.00",
    rewardClaimCount: 0,
    fulfilledRewardCount: 0,
    fulfilledRewardValueInr: 0,
    siteSummary: "No sites",
    citySummary: "No city",
    createdAt: new Date("2026-06-22T00:00:00.000Z"),
    sites: [],
    ...overrides,
  };
}
