import type { AuthenticatedActor } from "../auth/authenticated-actor.js";

export const ADMIN_STAFF_REPOSITORY = Symbol("ADMIN_STAFF_REPOSITORY");

export type ManagedAdminRole = "ADMIN" | "STAFF";

export interface AdminStaffSummary {
  readonly staffId: string;
  readonly userId: string;
  readonly role: ManagedAdminRole;
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly status: "ACTIVE" | "DEACTIVATED";
  readonly createdAt: Date;
  readonly deactivatedAt?: Date;
  readonly lastOpenedAt?: Date;
  readonly createdByOwnerId?: string;
  readonly createdByLabel?: string;
}

export interface AdminStaffWriteInput {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
}

export interface AdminStaffPhotoInput {
  readonly photoUrl: string | null;
}

export interface AdminStaffMutationResult {
  readonly staff: AdminStaffSummary;
  readonly temporaryPin: string;
}

export interface AdminMobileRegistration {
  readonly userId: string;
  readonly role: string;
  readonly staff?: AdminStaffSummary;
}

export interface AdminStaffRepository {
  listStaff(): Promise<readonly AdminStaffSummary[]>;
  listAdmins(): Promise<readonly AdminStaffSummary[]>;
  getStaff(staffId: string): Promise<AdminStaffSummary | null>;
  getAdmin(adminId: string): Promise<AdminStaffSummary | null>;
  getStaffByUserId(userId: string): Promise<AdminStaffSummary | null>;
  findMobileRegistration(mobileNumber: string): Promise<AdminMobileRegistration | null>;
  createStaff(input: AdminStaffWriteInput, pinHash: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
  createAdmin(input: AdminStaffWriteInput, pinHash: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
  updateStaffPhoto(staffId: string, photoUrl: string | null, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
  resetStaffPin(staffId: string, pinHash: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
  deactivateStaff(staffId: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
  reactivateStaff(staffId: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
  resetAdminPin(adminId: string, pinHash: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
  deactivateAdmin(adminId: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
  reactivateAdmin(adminId: string, actor: AuthenticatedActor, now: Date): Promise<AdminStaffSummary>;
}
