import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import type { AdminStaffRepository, AdminStaffSummary, AdminStaffWriteInput } from "./admin-staff.repository.js";
import { AdminStaffService } from "./admin-staff.service.js";

const ownerActor: AuthenticatedActor = { role: "OWNER", userId: "owner_user_1" };
const adminActor: AuthenticatedActor = { role: "ADMIN", userId: "admin_user_1" };
const staffActor: AuthenticatedActor = { role: "STAFF", userId: "user_1" };
const otherStaffActor: AuthenticatedActor = { role: "STAFF", userId: "other_user" };
const existingStaff = makeStaff({
  staffId: "staff_existing",
  mobileNumber: "9876543210",
});

test("AdminStaffService normalizes staff creation and blocks duplicate mobiles", async () => {
  const seenCreates: Array<{ readonly input: AdminStaffWriteInput; readonly pinHash: string }> = [];
  const service = makeService({
    listStaff: () => Promise.resolve([]),
    getStaff: () => Promise.resolve(null),
    findMobileRegistration: (mobileNumber) =>
      Promise.resolve(mobileNumber === "9876543210" ? { userId: "user_existing", role: "STAFF", staff: existingStaff } : null),
    createStaff: (input, pinHash) => {
      seenCreates.push({ input, pinHash });
      return Promise.resolve(makeStaff({ mobileNumber: input.mobileNumber, name: input.name }));
    },
    resetStaffPin: () => Promise.resolve(existingStaff),
    deactivateStaff: () => Promise.resolve(existingStaff),
    reactivateStaff: () => Promise.resolve(existingStaff),
  });

  await assert.rejects(
    service.createStaff({ name: "Existing", mobileNumber: "9876543210" }, ownerActor),
    (error) => error instanceof ConflictException,
  );

  const created = await service.createStaff({ name: "  Priya   Sharma ", mobileNumber: "+91 91234 56789" }, ownerActor);

  assert.equal(created.temporaryPin, "4821");
  assert.equal(created.staff.mobileNumber, "9123456789");
  assert.equal(created.staff.name, "Priya Sharma");
  assert.deepEqual(seenCreates.map((item) => item.input), [{ name: "Priya Sharma", mobileNumber: "9123456789" }]);
  assert.ok(seenCreates[0]?.pinHash.startsWith("sha256:"));
});

test("AdminStaffService rejects invalid staff creation input", async () => {
  const service = makeService({
    listStaff: () => Promise.resolve([]),
    getStaff: () => Promise.resolve(null),
    findMobileRegistration: () => Promise.resolve(null),
    createStaff: () => Promise.resolve(existingStaff),
    resetStaffPin: () => Promise.resolve(existingStaff),
    deactivateStaff: () => Promise.resolve(existingStaff),
    reactivateStaff: () => Promise.resolve(existingStaff),
  });

  await assert.rejects(
    service.createStaff({ name: "Priya", mobileNumber: "12345" }, ownerActor),
    (error) => error instanceof BadRequestException,
  );
});

test("AdminStaffService returns NotFoundException for missing staff mutations", async () => {
  const service = makeService({
    listStaff: () => Promise.resolve([]),
    getStaff: () => Promise.resolve(null),
    findMobileRegistration: () => Promise.resolve(null),
    createStaff: () => Promise.resolve(existingStaff),
    resetStaffPin: () => Promise.resolve(existingStaff),
    deactivateStaff: () => Promise.resolve(existingStaff),
    reactivateStaff: () => Promise.resolve(existingStaff),
  });

  await assert.rejects(
    service.resetStaffPin("missing_staff", ownerActor),
    (error) => error instanceof NotFoundException,
  );
});

test("AdminStaffService resets active staff PIN and blocks inactive staff reset", async () => {
  const seenPinHashes: string[] = [];
  const service = makeService({
    listStaff: () => Promise.resolve([]),
    getStaff: (staffId) =>
      Promise.resolve(staffId === "inactive_staff" ? makeStaff({ status: "DEACTIVATED" }) : existingStaff),
    findMobileRegistration: () => Promise.resolve(null),
    createStaff: () => Promise.resolve(existingStaff),
    resetStaffPin: (_staffId, pinHash) => {
      seenPinHashes.push(pinHash);
      return Promise.resolve(existingStaff);
    },
    deactivateStaff: () => Promise.resolve(makeStaff({ status: "DEACTIVATED" })),
    reactivateStaff: () => Promise.resolve(existingStaff),
  });

  const result = await service.resetStaffPin("staff_existing", ownerActor);

  assert.equal(result.temporaryPin, "4821");
  assert.ok(seenPinHashes[0]?.startsWith("sha256:"));
  await assert.rejects(
    service.resetStaffPin("inactive_staff", ownerActor),
    (error) => error instanceof BadRequestException,
  );
});

test("AdminStaffService deactivates and reactivates staff with state guards", async () => {
  const deactivated = makeStaff({ status: "DEACTIVATED", deactivatedAt: new Date("2026-07-01T00:00:00.000Z") });
  const service = makeService({
    listStaff: () => Promise.resolve([]),
    getStaff: (staffId) => Promise.resolve(staffId === "inactive_staff" ? deactivated : existingStaff),
    findMobileRegistration: () => Promise.resolve(null),
    createStaff: () => Promise.resolve(existingStaff),
    resetStaffPin: () => Promise.resolve(existingStaff),
    deactivateStaff: () => Promise.resolve(deactivated),
    reactivateStaff: () => Promise.resolve(existingStaff),
  });

  assert.equal((await service.deactivateStaff("staff_existing", ownerActor)).status, "DEACTIVATED");
  assert.equal((await service.reactivateStaff("inactive_staff", ownerActor)).status, "ACTIVE");

  await assert.rejects(
    service.deactivateStaff("inactive_staff", ownerActor),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    service.reactivateStaff("staff_existing", ownerActor),
    (error) => error instanceof BadRequestException,
  );
});

test("AdminStaffService updates staff photos for OWNER or self only", async () => {
  const seenUpdates: Array<{ readonly staffId: string; readonly photoUrl: string | null }> = [];
  const service = makeService({
    getStaff: () => Promise.resolve(existingStaff),
    updateStaffPhoto: (staffId, photoUrl) => {
      seenUpdates.push({ staffId, photoUrl });
      return Promise.resolve(makeStaff({ staffId, ...(photoUrl ? { photoUrl } : {}) }));
    },
  });

  await service.updateStaffPhoto("staff_existing", { photoUrl: " data:image/jpeg;base64,staff " }, ownerActor);
  await service.updateStaffPhoto("staff_existing", { photoUrl: "data:image/png;base64,admin" }, adminActor);
  await service.updateStaffPhoto("staff_existing", { photoUrl: "" }, staffActor);

  assert.deepEqual(seenUpdates, [
    { staffId: "staff_existing", photoUrl: "data:image/jpeg;base64,staff" },
    { staffId: "staff_existing", photoUrl: "data:image/png;base64,admin" },
    { staffId: "staff_existing", photoUrl: null },
  ]);

  await assert.rejects(
    service.updateStaffPhoto("staff_existing", { photoUrl: "data:image/jpeg;base64,blocked" }, otherStaffActor),
    (error) => error instanceof ForbiddenException,
  );
});

test("AdminStaffService updates own profile photo for ADMIN and STAFF sessions", async () => {
  const adminAccount = makeStaff({
    staffId: "admin_1",
    userId: "admin_user_1",
    role: "ADMIN",
    name: "Rohit Iyer",
  });
  const seenUpdates: Array<{ readonly staffId: string; readonly photoUrl: string | null; readonly actorRole: string }> = [];
  const service = makeService({
    getStaffByUserId: (userId) => Promise.resolve(userId === "admin_user_1" ? adminAccount : existingStaff),
    updateStaffPhoto: (staffId, photoUrl, actor) => {
      seenUpdates.push({ staffId, photoUrl, actorRole: actor.role });
      return Promise.resolve(staffId === "admin_1" ? makeStaff({ ...adminAccount, ...(photoUrl ? { photoUrl } : {}) }) : existingStaff);
    },
  });

  const updatedAdmin = await service.updateMyStaffPhoto({ photoUrl: " data:image/png;base64,admin " }, adminActor);
  const updatedStaff = await service.updateMyStaffPhoto({ photoUrl: "" }, staffActor);

  assert.equal(updatedAdmin.role, "ADMIN");
  assert.deepEqual(seenUpdates, [
    { staffId: "admin_1", photoUrl: "data:image/png;base64,admin", actorRole: "ADMIN" },
    { staffId: "staff_existing", photoUrl: null, actorRole: "STAFF" },
  ]);
  assert.equal(updatedStaff.role, "STAFF");
});

test("AdminStaffService lets OWNER manage Admin accounts and blocks ADMIN from Admin management", async () => {
  const adminAccount = makeStaff({
    staffId: "admin_1",
    userId: "admin_user_1",
    role: "ADMIN",
    name: "Rohit Iyer",
    mobileNumber: "9000000093",
  });
  const deactivatedAdmin = makeStaff({
    ...adminAccount,
    staffId: "inactive_admin",
    status: "DEACTIVATED",
    deactivatedAt: new Date("2026-07-10T00:00:00.000Z"),
  });
  const createdAdmins: Array<{ readonly input: AdminStaffWriteInput; readonly pinHash: string }> = [];
  const service = makeService({
    listAdmins: () => Promise.resolve([adminAccount]),
    getAdmin: (adminId) => Promise.resolve(adminId === "inactive_admin" ? deactivatedAdmin : adminAccount),
    findMobileRegistration: () => Promise.resolve(null),
    createAdmin: (input, pinHash) => {
      createdAdmins.push({ input, pinHash });
      return Promise.resolve(makeStaff({ ...adminAccount, name: input.name, mobileNumber: input.mobileNumber }));
    },
    resetAdminPin: () => Promise.resolve(adminAccount),
    deactivateAdmin: () => Promise.resolve(makeStaff({ ...adminAccount, status: "DEACTIVATED" })),
    reactivateAdmin: () => Promise.resolve(adminAccount),
  });

  assert.deepEqual((await service.listAdmins(ownerActor)).map((account) => account.role), ["ADMIN"]);
  const created = await service.createAdmin({ name: "  Rohit   Iyer ", mobileNumber: "+91 90000 00093" }, ownerActor);
  assert.equal(created.temporaryPin, "4821");
  assert.equal(created.staff.role, "ADMIN");
  assert.deepEqual(createdAdmins.map((item) => item.input), [{ name: "Rohit Iyer", mobileNumber: "9000000093" }]);
  assert.equal((await service.resetAdminPin("admin_1", ownerActor)).temporaryPin, "4821");
  assert.equal((await service.deactivateAdmin("admin_1", ownerActor)).status, "DEACTIVATED");
  assert.equal((await service.reactivateAdmin("inactive_admin", ownerActor)).status, "ACTIVE");

  await assert.rejects(
    () => service.listAdmins(adminActor),
    (error) => error instanceof ForbiddenException,
  );
  await assert.rejects(
    service.createAdmin({ name: "Blocked Admin", mobileNumber: "9000000094" }, adminActor),
    (error) => error instanceof ForbiddenException,
  );
});

function makeService(repository: Partial<AdminStaffRepository>): AdminStaffService {
  class TestAdminStaffService extends AdminStaffService {
    protected override generateTemporaryPin(): string {
      return "4821";
    }
  }

  return new TestAdminStaffService({
    listStaff: () => Promise.resolve([]),
    listAdmins: () => Promise.resolve([]),
    getStaff: () => Promise.resolve(existingStaff),
    getAdmin: () => Promise.resolve(null),
    getStaffByUserId: (userId) => Promise.resolve(userId === existingStaff.userId ? existingStaff : null),
    findMobileRegistration: () => Promise.resolve(null),
    createStaff: () => Promise.resolve(existingStaff),
    createAdmin: () => Promise.resolve(makeStaff({ role: "ADMIN" })),
    updateStaffPhoto: () => Promise.resolve(existingStaff),
    resetStaffPin: () => Promise.resolve(existingStaff),
    deactivateStaff: () => Promise.resolve(existingStaff),
    reactivateStaff: () => Promise.resolve(existingStaff),
    resetAdminPin: () => Promise.resolve(makeStaff({ role: "ADMIN" })),
    deactivateAdmin: () => Promise.resolve(makeStaff({ role: "ADMIN", status: "DEACTIVATED" })),
    reactivateAdmin: () => Promise.resolve(makeStaff({ role: "ADMIN" })),
    ...repository,
  });
}

function makeStaff(overrides: Partial<AdminStaffSummary> = {}): AdminStaffSummary {
  return {
    staffId: "staff_1",
    userId: "user_1",
    role: "STAFF",
    name: "Priya Sharma",
    mobileNumber: "9876543210",
    status: "ACTIVE",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    ...overrides,
  };
}
