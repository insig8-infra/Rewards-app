import type { AuthenticatedActor } from "../auth/authenticated-actor.js";

export const SITES_REPOSITORY = Symbol("SITES_REPOSITORY");

export interface SiteWriteInput {
  readonly clientName: string;
  readonly flatOrApartmentNo?: string;
  readonly buildingName?: string;
  readonly area?: string;
  readonly city?: string;
}

export interface SiteSummary {
  readonly siteId: string;
  readonly contractorId: string;
  readonly clientName: string;
  readonly flatOrApartmentNo?: string;
  readonly buildingName?: string;
  readonly area?: string;
  readonly city?: string;
  readonly status: "ACTIVE" | "ARCHIVED";
  readonly scanCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SitesRepository {
  listSites(contractorId: string, options?: { readonly activeOnly?: boolean }): Promise<readonly SiteSummary[]>;
  getSite(siteId: string): Promise<SiteSummary | null>;
  createSite(
    contractorId: string,
    input: SiteWriteInput,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<SiteSummary>;
  updateSite(
    siteId: string,
    input: SiteWriteInput,
    actor: AuthenticatedActor,
    now: Date,
  ): Promise<SiteSummary>;
  archiveSite(siteId: string, actor: AuthenticatedActor, now: Date): Promise<SiteSummary>;
}
