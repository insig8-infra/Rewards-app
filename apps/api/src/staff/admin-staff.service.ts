import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomInt } from "node:crypto";
import { ACTOR_ROLE, DomainError, assertValidStaffPin, normalizeStaffProfile } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { hashAdminPin } from "../auth/mobile-auth.service.js";
import {
  ADMIN_STAFF_REPOSITORY,
  type AdminStaffMutationResult,
  type AdminStaffPhotoInput,
  type AdminStaffRepository,
  type AdminStaffSummary,
  type AdminStaffWriteInput,
} from "./admin-staff.repository.js";

@Injectable()
export class AdminStaffService {
  constructor(
    @Inject(ADMIN_STAFF_REPOSITORY)
    private readonly repository: AdminStaffRepository,
  ) {}

  listStaff(): Promise<readonly AdminStaffSummary[]> {
    return this.repository.listStaff();
  }

  async listAdmins(actor: AuthenticatedActor): Promise<readonly AdminStaffSummary[]> {
    assertOwnerCanManageAdmins(actor);
    return this.repository.listAdmins();
  }

  getStaff(staffId: string): Promise<AdminStaffSummary> {
    return this.getStaffOrThrow(staffId);
  }

  async getAdmin(adminId: string, actor: AuthenticatedActor): Promise<AdminStaffSummary> {
    assertOwnerCanManageAdmins(actor);
    const admin = await this.repository.getAdmin(adminId);
    if (!admin) {
      throw new NotFoundException("Admin account was not found.");
    }
    return admin;
  }

  async getMyStaff(actor: AuthenticatedActor): Promise<AdminStaffSummary> {
    if (!actor.userId) {
      throw new ForbiddenException("An admin or staff user session is required.");
    }

    const staff = await this.repository.getStaffByUserId(actor.userId);
    if (!staff) {
      throw new NotFoundException("Staff member was not found.");
    }
    return staff;
  }

  async createStaff(
    input: AdminStaffWriteInput,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminStaffMutationResult> {
    const normalized = normalizeOrBadRequest(input);
    const existing = await this.repository.findMobileRegistration(normalized.mobileNumber);
    if (existing) {
      throw duplicateMobileConflict(existing.staff);
    }

    const temporaryPin = this.generateTemporaryPin();
    assertPinOrBadRequest(temporaryPin);
    const staff = await this.repository.createStaff(normalized, hashStaffPin(temporaryPin), actor, now);

    return { staff, temporaryPin };
  }

  async createAdmin(
    input: AdminStaffWriteInput,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminStaffMutationResult> {
    assertOwnerCanManageAdmins(actor);
    const normalized = normalizeOrBadRequest(input);
    const existing = await this.repository.findMobileRegistration(normalized.mobileNumber);
    if (existing) {
      throw duplicateMobileConflict(existing.staff);
    }

    const temporaryPin = this.generateTemporaryPin();
    assertPinOrBadRequest(temporaryPin);
    const staff = await this.repository.createAdmin(normalized, hashStaffPin(temporaryPin), actor, now);

    return { staff, temporaryPin };
  }

  async updateStaffPhoto(
    staffId: string,
    input: AdminStaffPhotoInput,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminStaffSummary> {
    const current = await this.getStaffOrThrow(staffId);
    if (!canManageStaffAccounts(actor.role) && current.userId !== actor.userId) {
      throw new ForbiddenException("Staff can update only their own photo.");
    }

    return this.repository.updateStaffPhoto(staffId, normalizePhotoUrl(input.photoUrl), actor, now);
  }

  async updateMyStaffPhoto(
    input: AdminStaffPhotoInput,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminStaffSummary> {
    const current = await this.getMyStaff(actor);
    return this.repository.updateStaffPhoto(current.staffId, normalizePhotoUrl(input.photoUrl), actor, now);
  }

  async resetStaffPin(
    staffId: string,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminStaffMutationResult> {
    const current = await this.getStaffOrThrow(staffId);
    if (current.status !== "ACTIVE") {
      throw new BadRequestException("Reactivate staff before resetting PIN.");
    }

    const temporaryPin = this.generateTemporaryPin();
    assertPinOrBadRequest(temporaryPin);
    const staff = await this.repository.resetStaffPin(staffId, hashStaffPin(temporaryPin), actor, now);

    return { staff, temporaryPin };
  }

  async deactivateStaff(staffId: string, actor: AuthenticatedActor, now = new Date()): Promise<AdminStaffSummary> {
    const current = await this.getStaffOrThrow(staffId);
    if (current.status === "DEACTIVATED") {
      throw new BadRequestException("Staff is already deactivated.");
    }

    return this.repository.deactivateStaff(staffId, actor, now);
  }

  async reactivateStaff(staffId: string, actor: AuthenticatedActor, now = new Date()): Promise<AdminStaffSummary> {
    const current = await this.getStaffOrThrow(staffId);
    if (current.status === "ACTIVE") {
      throw new BadRequestException("Staff is already active.");
    }

    return this.repository.reactivateStaff(staffId, actor, now);
  }

  async resetAdminPin(
    adminId: string,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminStaffMutationResult> {
    assertOwnerCanManageAdmins(actor);
    const current = await this.getAdmin(adminId, actor);
    if (current.status !== "ACTIVE") {
      throw new BadRequestException("Reactivate admin before resetting PIN.");
    }

    const temporaryPin = this.generateTemporaryPin();
    assertPinOrBadRequest(temporaryPin);
    const staff = await this.repository.resetAdminPin(adminId, hashStaffPin(temporaryPin), actor, now);

    return { staff, temporaryPin };
  }

  async deactivateAdmin(adminId: string, actor: AuthenticatedActor, now = new Date()): Promise<AdminStaffSummary> {
    assertOwnerCanManageAdmins(actor);
    const current = await this.getAdmin(adminId, actor);
    if (current.status === "DEACTIVATED") {
      throw new BadRequestException("Admin is already deactivated.");
    }

    return this.repository.deactivateAdmin(adminId, actor, now);
  }

  async reactivateAdmin(adminId: string, actor: AuthenticatedActor, now = new Date()): Promise<AdminStaffSummary> {
    assertOwnerCanManageAdmins(actor);
    const current = await this.getAdmin(adminId, actor);
    if (current.status === "ACTIVE") {
      throw new BadRequestException("Admin is already active.");
    }

    return this.repository.reactivateAdmin(adminId, actor, now);
  }

  private async getStaffOrThrow(staffId: string): Promise<AdminStaffSummary> {
    const staff = await this.repository.getStaff(staffId);
    if (!staff) {
      throw new NotFoundException("Staff member was not found.");
    }
    return staff;
  }

  protected generateTemporaryPin(): string {
    return generateStaffPin();
  }
}

function canManageStaffAccounts(role: AuthenticatedActor["role"]): boolean {
  return role === ACTOR_ROLE.OWNER || role === ACTOR_ROLE.ADMIN;
}

function assertOwnerCanManageAdmins(actor: AuthenticatedActor): void {
  if (actor.role !== ACTOR_ROLE.OWNER) {
    throw new ForbiddenException("Only OWNER can manage Admin accounts.");
  }
}

function normalizeOrBadRequest(input: AdminStaffWriteInput): AdminStaffWriteInput {
  try {
    const normalized = normalizeStaffProfile(input);
    const photoUrl = normalizePhotoUrl(input.photoUrl);
    return {
      ...normalized,
      ...(photoUrl ? { photoUrl } : {}),
    };
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({
        message: error.message,
        code: error.code,
      });
    }
    throw error;
  }
}

function normalizePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) {
    return null;
  }

  const normalized = photoUrl.trim();
  return normalized ? normalized : null;
}

function assertPinOrBadRequest(pin: string): void {
  try {
    assertValidStaffPin(pin);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({
        message: error.message,
        code: error.code,
      });
    }
    throw error;
  }
}

function generateStaffPin(): string {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

function hashStaffPin(pin: string): string {
  return hashAdminPin(pin);
}

function duplicateMobileConflict(existingStaff?: AdminStaffSummary) {
  return new ConflictException({
    message: "Mobile number is already registered.",
    ...(existingStaff ? { existingStaff } : {}),
  });
}
