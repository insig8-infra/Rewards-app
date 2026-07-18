import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { UnauthorizedException } from "@nestjs/common";
import { ACTOR_ROLE, type ActorRole } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "./authenticated-actor.js";
import {
  type AdminAuthProfile,
  type AuthSessionRecord,
  type ContractorAuthProfile,
  type CreateSessionInput,
  type MobileAuthRepository,
  type OtpChallengeRecord,
} from "./mobile-auth.repository.js";
import { hashToken, MobileAuthService } from "./mobile-auth.service.js";

test("MobileAuthService authenticates OWNER and STAFF admin PIN sessions", async () => {
  const repository = new InMemoryMobileAuthRepository();
  const service = new DeterministicMobileAuthService(repository);
  const now = new Date("2026-07-06T08:00:00.000Z");

  const owner = await service.loginAdmin(
    { role: ACTOR_ROLE.OWNER, mobileNumber: "9000000091", pin: "1111" },
    now,
  );
  assert.equal(owner.status, "AUTHENTICATED");
  assert.equal(owner.admin.name, "Shishir Mehta");
  assert.equal(owner.session.actor.role, ACTOR_ROLE.OWNER);
  assert.equal(owner.session.expiresAt.toISOString(), "2026-07-10T08:00:00.000Z");
  assert.ok(await repository.findActiveSessionByTokenHash(hashToken(owner.session.token), now));

  const staff = await service.loginAdmin(
    { role: ACTOR_ROLE.STAFF, mobileNumber: "9000000092", pin: "2222" },
    now,
  );
  assert.equal(staff.status, "AUTHENTICATED");
  assert.equal(staff.admin.name, "Aarti Deshmukh");
  assert.equal(staff.admin.staffId, "staff_1");
  assert.equal(staff.session.actor.role, ACTOR_ROLE.STAFF);
});

test("MobileAuthService rejects invalid or inactive admin login", async () => {
  const repository = new InMemoryMobileAuthRepository();
  const service = new DeterministicMobileAuthService(repository);

  await assert.rejects(
    service.loginAdmin({ role: ACTOR_ROLE.OWNER, mobileNumber: "9000000091", pin: "9999" }),
    (error) => error instanceof UnauthorizedException,
  );
  await assert.rejects(
    service.loginAdmin({ role: ACTOR_ROLE.STAFF, mobileNumber: "9000000093", pin: "3333" }),
    (error) => error instanceof UnauthorizedException,
  );
});

test("MobileAuthService supports reset -> temporary login -> set MPIN -> normal login", async () => {
  const repository = new InMemoryMobileAuthRepository();
  const service = new DeterministicMobileAuthService(repository);
  const now = new Date("2026-07-01T08:00:00.000Z");

  const reset = await service.resetContractorMpin(
    "contractor_1",
    { role: ACTOR_ROLE.OWNER, userId: "owner_1" },
    now,
  );
  assert.equal(reset.temporaryMpin, "2468");
  assert.equal(reset.expiresAt.toISOString(), "2026-07-06T08:00:00.000Z");

  const temporaryLogin = await service.loginContractor(
    { mobileNumber: "9876543210", mpin: "2468" },
    new Date("2026-07-01T08:05:00.000Z"),
  );
  assert.equal(temporaryLogin.status, "MPIN_SETUP_REQUIRED");
  assert.equal(temporaryLogin.session.requiresMpinSetup, true);

  const setMpin = await service.setContractorMpin(
    {
      setupSessionToken: temporaryLogin.session.token,
      newMpin: "1357",
      confirmMpin: "1357",
    },
    new Date("2026-07-01T08:06:00.000Z"),
  );
  assert.equal(setMpin.status, "AUTHENTICATED");
  assert.equal(setMpin.session.requiresMpinSetup, false);

  const normalLogin = await service.loginContractor(
    { mobileNumber: "9876543210", mpin: "1357" },
    new Date("2026-07-01T08:07:00.000Z"),
  );
  assert.equal(normalLogin.status, "AUTHENTICATED");
  assert.equal(normalLogin.session.actor.contractorId, "contractor_1");
});

test("MobileAuthService changes MPIN and revokes old contractor sessions", async () => {
  const repository = new InMemoryMobileAuthRepository();
  const service = new DeterministicMobileAuthService(repository);
  const resetAt = new Date("2026-07-01T08:00:00.000Z");
  const reset = await service.resetContractorMpin("contractor_1", { role: ACTOR_ROLE.OWNER }, resetAt);
  const temporaryLogin = await service.loginContractor(
    { mobileNumber: "9876543210", mpin: reset.temporaryMpin },
    new Date("2026-07-01T08:05:00.000Z"),
  );
  const setMpin = await service.setContractorMpin(
    {
      setupSessionToken: temporaryLogin.session.token,
      newMpin: "1357",
      confirmMpin: "1357",
    },
    new Date("2026-07-01T08:06:00.000Z"),
  );

  const changed = await service.changeContractorMpin(
    {
      sessionToken: setMpin.session.token,
      oldMpin: "1357",
      newMpin: "9753",
      confirmMpin: "9753",
    },
    new Date("2026-07-01T08:07:00.000Z"),
  );

  assert.equal(changed.status, "AUTHENTICATED");
  assert.equal(
    await repository.findActiveSessionByTokenHash(hashToken(setMpin.session.token), new Date("2026-07-01T08:08:00.000Z")),
    null,
  );
  await assert.rejects(
    service.loginContractor({ mobileNumber: "9876543210", mpin: "1357" }, new Date("2026-07-01T08:09:00.000Z")),
    (error) => error instanceof UnauthorizedException,
  );
  assert.equal(
    (await service.loginContractor({ mobileNumber: "9876543210", mpin: "9753" }, new Date("2026-07-01T08:10:00.000Z"))).status,
    "AUTHENTICATED",
  );
});

test("MobileAuthService lets contractor update and remove their own profile photo", async () => {
  const repository = new InMemoryMobileAuthRepository();
  const service = new DeterministicMobileAuthService(repository);
  const resetAt = new Date("2026-07-01T08:00:00.000Z");
  const reset = await service.resetContractorMpin("contractor_1", { role: ACTOR_ROLE.OWNER }, resetAt);
  const temporaryLogin = await service.loginContractor(
    { mobileNumber: "9876543210", mpin: reset.temporaryMpin },
    new Date("2026-07-01T08:05:00.000Z"),
  );
  const setMpin = await service.setContractorMpin(
    {
      setupSessionToken: temporaryLogin.session.token,
      newMpin: "1357",
      confirmMpin: "1357",
    },
    new Date("2026-07-01T08:06:00.000Z"),
  );

  const updated = await service.updateContractorPhoto(
    {
      sessionToken: setMpin.session.token,
      photoUrl: "data:image/png;base64,aGVsbG8=",
    },
    new Date("2026-07-01T08:07:00.000Z"),
  );

  assert.equal(updated.contractor.photoUrl, "data:image/png;base64,aGVsbG8=");

  const removed = await service.updateContractorPhoto(
    {
      sessionToken: setMpin.session.token,
      photoUrl: null,
    },
    new Date("2026-07-01T08:08:00.000Z"),
  );

  assert.equal(removed.contractor.photoUrl, undefined);
});

test("MobileAuthService requests and verifies Team Member OTP without durable Team Member profile", async () => {
  const repository = new InMemoryMobileAuthRepository();
  const service = new DeterministicMobileAuthService(repository);

  const request = await service.requestTeamMemberOtp({
    contractorMobileNumber: "9876543210",
    teamMemberMobile: "9123456780",
    deviceContext: { platform: "test" },
  });

  assert.equal(request.status, "OTP_SENT");
  assert.equal(request.delivery?.mockOtp, "654321");
  assert.ok(request.challengeId);

  const verified = await service.verifyTeamMemberOtp({
    challengeId: request.challengeId,
    otp: "654321",
  });

  assert.equal(verified.status, "AUTHENTICATED");
  assert.equal(verified.session.actor.role, ACTOR_ROLE.TEAM_MEMBER);
  assert.equal(verified.session.actor.contractorId, "contractor_1");
  assert.equal(verified.session.actor.teamMemberMobile, "9123456780");
});

test("MobileAuthService returns neutral not-registered result for unknown Team Member contractor mobile", async () => {
  const service = new DeterministicMobileAuthService(new InMemoryMobileAuthRepository());

  const result = await service.requestTeamMemberOtp({
    contractorMobileNumber: "9999999999",
    teamMemberMobile: "9123456780",
  });

  assert.equal(result.status, "NOT_REGISTERED");
  assert.equal(result.challengeId, undefined);
});

class DeterministicMobileAuthService extends MobileAuthService {
  protected override generateMpin(): string {
    return "2468";
  }

  protected override generateOtp(): string {
    return "654321";
  }
}

class InMemoryMobileAuthRepository implements MobileAuthRepository {
  private readonly admins = new Map<string, AdminAuthProfile>();
  private readonly contractors = new Map<string, ContractorAuthProfile>();
  private readonly sessions = new Map<string, AuthSessionRecord & { status: "ACTIVE" | "REVOKED"; tokenHash: string }>();
  private readonly otpChallenges = new Map<string, OtpChallengeRecord>();

  constructor() {
    this.admins.set("OWNER:9000000091", {
      userId: "dev-owner-user",
      role: ACTOR_ROLE.OWNER,
      name: "Shishir Mehta",
      mobileNumber: "9000000091",
      status: "ACTIVE",
      pinHash: adminPinHash("1111"),
    });
    this.admins.set("STAFF:9000000092", {
      userId: "dev-staff-user",
      role: ACTOR_ROLE.STAFF,
      staffId: "staff_1",
      name: "Aarti Deshmukh",
      mobileNumber: "9000000092",
      status: "ACTIVE",
      pinHash: adminPinHash("2222"),
    });
    this.admins.set("STAFF:9000000093", {
      userId: "inactive-staff-user",
      role: ACTOR_ROLE.STAFF,
      staffId: "staff_inactive",
      name: "Nitin Jadhav",
      mobileNumber: "9000000093",
      status: "DEACTIVATED",
      pinHash: adminPinHash("3333"),
    });
    this.contractors.set(
      "contractor_1",
      {
        contractorId: "contractor_1",
        userId: "user_contractor_1",
        contractorCode: "CON-000001",
        name: "Demo Contractor",
        mobileNumber: "9876543210",
        status: "ACTIVE",
        totalAccumulatedPoints: 100,
        availablePoints: 80,
      },
    );
  }

  async findAdminByMobileAndRole(mobileNumber: string, role: "OWNER" | "STAFF"): Promise<AdminAuthProfile | null> {
    return this.admins.get(`${role}:${mobileNumber}`) ?? null;
  }

  async findContractorByMobile(mobileNumber: string): Promise<ContractorAuthProfile | null> {
    return [...this.contractors.values()].find((contractor) => contractor.mobileNumber === mobileNumber) ?? null;
  }

  async getContractorById(contractorId: string): Promise<ContractorAuthProfile | null> {
    return this.contractors.get(contractorId) ?? null;
  }

  async setTemporaryMpin(
    contractorId: string,
    temporaryMpinHash: string,
    expiresAt: Date,
  ): Promise<ContractorAuthProfile> {
    const current = this.getExistingContractor(contractorId);
    const updated = {
      ...current,
      temporaryMpinHash,
      temporaryMpinExpiresAt: expiresAt,
    };
    this.contractors.set(contractorId, updated);
    return updated;
  }

  async setContractorMpin(contractorId: string, mpinHash: string, now: Date): Promise<ContractorAuthProfile> {
    const current = this.getExistingContractor(contractorId);
    const {
      temporaryMpinHash: _temporaryMpinHash,
      temporaryMpinExpiresAt: _temporaryMpinExpiresAt,
      ...withoutTemporaryMpin
    } = current;
    const updated = {
      ...withoutTemporaryMpin,
      mpinHash,
      mpinSetAt: now,
    };
    this.contractors.set(contractorId, updated);
    return updated;
  }

  async updateContractorPhoto(contractorId: string, photoUrl: string | null): Promise<ContractorAuthProfile> {
    const current = this.getExistingContractor(contractorId);
    const { photoUrl: _photoUrl, ...withoutPhotoUrl } = current;
    const updated = photoUrl ? { ...current, photoUrl } : withoutPhotoUrl;
    this.contractors.set(contractorId, updated);
    return updated;
  }

  async revokeContractorSessions(contractorId: string, now: Date): Promise<void> {
    for (const [tokenHash, session] of this.sessions.entries()) {
      if (session.actor.contractorId === contractorId) {
        this.sessions.set(tokenHash, { ...session, status: "REVOKED", expiresAt: session.expiresAt });
      }
    }
    void now;
  }

  async createSession(input: CreateSessionInput): Promise<AuthSessionRecord> {
    const session: AuthSessionRecord & { status: "ACTIVE" | "REVOKED"; tokenHash: string } = {
      sessionId: `session_${this.sessions.size + 1}`,
      tokenHash: input.tokenHash,
      actor: {
        role: input.actorRole,
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.contractorId ? { contractorId: input.contractorId } : {}),
        ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
      },
      expiresAt: input.expiresAt,
      requiresMpinSetup: input.requiresMpinSetup,
      status: "ACTIVE",
    };
    this.sessions.set(input.tokenHash, session);
    return session;
  }

  async findActiveSessionByTokenHash(tokenHash: string, now: Date): Promise<AuthSessionRecord | null> {
    const session = this.sessions.get(tokenHash);
    if (!session || session.status !== "ACTIVE" || session.requiresMpinSetup || session.expiresAt <= now) {
      return null;
    }
    return session;
  }

  async findMpinSetupSessionByTokenHash(tokenHash: string, now: Date): Promise<AuthSessionRecord | null> {
    const session = this.sessions.get(tokenHash);
    if (!session || session.status !== "ACTIVE" || !session.requiresMpinSetup || session.expiresAt <= now) {
      return null;
    }
    return session;
  }

  async createOtpChallenge(input: {
    readonly contractorId: string;
    readonly contractorMobileNumber: string;
    readonly teamMemberMobile?: string;
    readonly otpHash: string;
    readonly expiresAt: Date;
  }): Promise<OtpChallengeRecord> {
    const challenge: OtpChallengeRecord = {
      challengeId: `challenge_${this.otpChallenges.size + 1}`,
      contractorId: input.contractorId,
      contractorMobileNumber: input.contractorMobileNumber,
      otpHash: input.otpHash,
      status: "PENDING",
      expiresAt: input.expiresAt,
      ...(input.teamMemberMobile ? { teamMemberMobile: input.teamMemberMobile } : {}),
    };
    this.otpChallenges.set(challenge.challengeId, challenge);
    return challenge;
  }

  async getOtpChallenge(challengeId: string): Promise<OtpChallengeRecord | null> {
    return this.otpChallenges.get(challengeId) ?? null;
  }

  async markOtpChallengeVerified(challengeId: string, now: Date): Promise<void> {
    const challenge = this.otpChallenges.get(challengeId);
    if (challenge) {
      this.otpChallenges.set(challengeId, { ...challenge, status: "VERIFIED" });
    }
    void now;
  }

  async recordAuditEvent(): Promise<void> {}

  private getExistingContractor(contractorId: string): ContractorAuthProfile {
    const contractor = this.contractors.get(contractorId);
    if (!contractor) {
      throw new Error("Missing contractor.");
    }
    return contractor;
  }
}

function adminPinHash(pin: string): string {
  return `sha256:admin-pin:${createHash("sha256").update(`volt-rewards:admin-pin:${pin}`).digest("hex")}`;
}
