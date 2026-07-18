import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DomainError, normalizeContractorBelongsToNote, normalizeContractorProfile } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import {
  ADMIN_CONTRACTOR_REPOSITORY,
  type AdminContractorDetail,
  type AdminContractorPatchInput,
  type AdminContractorRepository,
  type AdminContractorSummary,
  type AdminContractorWriteInput,
} from "./admin-contractor.repository.js";

@Injectable()
export class AdminContractorService {
  constructor(
    @Inject(ADMIN_CONTRACTOR_REPOSITORY)
    private readonly repository: AdminContractorRepository,
  ) {}

  listContractors(): Promise<readonly AdminContractorSummary[]> {
    return this.repository.listContractors();
  }

  async getContractorDetail(contractorId: string): Promise<AdminContractorDetail> {
    const contractor = await this.repository.getContractorDetail(contractorId);
    if (!contractor) {
      throw new NotFoundException("Contractor was not found.");
    }
    return contractor;
  }

  async registerContractor(
    input: AdminContractorWriteInput,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminContractorDetail> {
    const normalized = normalizeOrBadRequest(input);
    const existing = await this.repository.findMobileRegistration(normalized.mobileNumber);
    if (existing) {
      throw duplicateMobileConflict(existing.contractor);
    }

    return this.repository.createContractor(normalized, actor, now);
  }

  async updateContractor(
    contractorId: string,
    input: AdminContractorPatchInput,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminContractorDetail> {
    await this.getContractorDetail(contractorId);
    if (input.name !== undefined || input.mobileNumber !== undefined) {
      throw new BadRequestException("Contractor name and mobile number are immutable after registration.");
    }
    if (!("photoUrl" in input) && !("belongsToNote" in input)) {
      throw new BadRequestException("Only contractor photo and association note updates are allowed after registration.");
    }

    return this.repository.updateContractor(contractorId, {
      ...("photoUrl" in input ? { photoUrl: normalizePhotoUrl(input.photoUrl) } : {}),
      ...("belongsToNote" in input ? { belongsToNote: normalizeBelongsToNoteOrBadRequest(input.belongsToNote) } : {}),
    }, actor, now);
  }

  async deactivateContractor(
    contractorId: string,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminContractorDetail> {
    const current = await this.getContractorDetail(contractorId);
    if (current.status === "DEACTIVATED") {
      throw new BadRequestException("Contractor is already deactivated.");
    }
    return this.repository.deactivateContractor(contractorId, actor, now);
  }

  async reactivateContractor(
    contractorId: string,
    actor: AuthenticatedActor,
    now = new Date(),
  ): Promise<AdminContractorDetail> {
    const current = await this.getContractorDetail(contractorId);
    if (current.status === "ACTIVE") {
      throw new BadRequestException("Contractor is already active.");
    }
    return this.repository.reactivateContractor(contractorId, actor, now);
  }
}

function normalizeBelongsToNoteOrBadRequest(note: string | null | undefined): string | null {
  try {
    return normalizeContractorBelongsToNote(note) ?? null;
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

function normalizeOrBadRequest(input: AdminContractorWriteInput): AdminContractorWriteInput {
  try {
    return normalizeContractorProfile(input);
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

function duplicateMobileConflict(existingContractor?: AdminContractorSummary) {
  return new ConflictException({
    message: "Mobile number is already registered.",
    ...(existingContractor ? { existingContractor } : {}),
  });
}

function normalizePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (photoUrl === null || photoUrl === undefined) {
    return null;
  }
  const trimmed = photoUrl.trim();
  return trimmed.length > 0 ? trimmed : null;
}
