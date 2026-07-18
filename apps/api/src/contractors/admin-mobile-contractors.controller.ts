import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { MobileAuthService } from "../auth/mobile-auth.service.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import type { AdminContractorPatchInput, AdminContractorWriteInput } from "./admin-contractor.repository.js";
import { AdminContractorService } from "./admin-contractor.service.js";

@Controller("admin-mobile/contractors")
@UseGuards(ActorGuard)
export class AdminMobileContractorsController {
  constructor(
    private readonly contractors: AdminContractorService,
    private readonly auth: MobileAuthService,
  ) {}

  @Get()
  @RequireAction(ACTION.ADMIN_VIEW_CONTRACTOR)
  listContractors(): ReturnType<AdminContractorService["listContractors"]> {
    return this.contractors.listContractors();
  }

  @Get(":contractorId")
  @RequireAction(ACTION.ADMIN_VIEW_CONTRACTOR)
  getContractorDetail(
    @Param("contractorId") contractorId: string,
  ): ReturnType<AdminContractorService["getContractorDetail"]> {
    return this.contractors.getContractorDetail(contractorId);
  }

  @Post()
  @RequireAction(ACTION.ADMIN_REGISTER_CONTRACTOR)
  registerContractor(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body: AdminContractorWriteInput,
  ): ReturnType<AdminContractorService["registerContractor"]> {
    return this.contractors.registerContractor(body, actor);
  }

  @Patch(":contractorId")
  @RequireAction(ACTION.ADMIN_EDIT_CONTRACTOR)
  updateContractor(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("contractorId") contractorId: string,
    @Body() body: AdminContractorPatchInput,
  ): ReturnType<AdminContractorService["updateContractor"]> {
    return this.contractors.updateContractor(contractorId, body, actor);
  }

  @Post(":contractorId/deactivate")
  @RequireAction(ACTION.ADMIN_EDIT_CONTRACTOR)
  deactivateContractor(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("contractorId") contractorId: string,
  ): ReturnType<AdminContractorService["deactivateContractor"]> {
    return this.contractors.deactivateContractor(contractorId, actor);
  }

  @Post(":contractorId/reactivate")
  @RequireAction(ACTION.ADMIN_EDIT_CONTRACTOR)
  reactivateContractor(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("contractorId") contractorId: string,
  ): ReturnType<AdminContractorService["reactivateContractor"]> {
    return this.contractors.reactivateContractor(contractorId, actor);
  }

  @Post(":contractorId/reset-mpin")
  @RequireAction(ACTION.ADMIN_EDIT_CONTRACTOR)
  resetContractorMpin(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("contractorId") contractorId: string,
    @Body()
    body: {
      readonly now?: string;
    } = {},
  ): ReturnType<MobileAuthService["resetContractorMpin"]> {
    return this.auth.resetContractorMpin(contractorId, actor, body.now ? new Date(body.now) : new Date());
  }
}
