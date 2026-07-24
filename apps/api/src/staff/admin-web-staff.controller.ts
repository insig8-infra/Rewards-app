import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import type { AdminStaffPhotoInput, AdminStaffWriteInput } from "./admin-staff.repository.js";
import { AdminStaffService } from "./admin-staff.service.js";

@Controller("admin-web/staff")
@UseGuards(ActorGuard)
export class AdminWebStaffController {
  constructor(private readonly staff: AdminStaffService) {}

  @Get()
  @RequireAction(ACTION.ADMIN_MANAGE_STAFF)
  listStaff(): ReturnType<AdminStaffService["listStaff"]> {
    return this.staff.listStaff();
  }

  @Get("me")
  @RequireAction(ACTION.REPORT_VIEW)
  getMyStaff(
    @CurrentActor() actor: AuthenticatedActor,
  ): ReturnType<AdminStaffService["getMyStaff"]> {
    return this.staff.getMyStaff(actor);
  }

  @Post("me/photo")
  @RequireAction(ACTION.REPORT_VIEW)
  updateMyStaffPhoto(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body: AdminStaffPhotoInput,
  ): ReturnType<AdminStaffService["updateMyStaffPhoto"]> {
    return this.staff.updateMyStaffPhoto(body, actor);
  }

  @Get(":staffId")
  @RequireAction(ACTION.ADMIN_MANAGE_STAFF)
  getStaff(
    @Param("staffId") staffId: string,
  ): ReturnType<AdminStaffService["getStaff"]> {
    return this.staff.getStaff(staffId);
  }

  @Post(":staffId/photo")
  @RequireAction(ACTION.REPORT_VIEW)
  updateStaffPhoto(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("staffId") staffId: string,
    @Body() body: AdminStaffPhotoInput,
  ): ReturnType<AdminStaffService["updateStaffPhoto"]> {
    return this.staff.updateStaffPhoto(staffId, body, actor);
  }

  @Post()
  @RequireAction(ACTION.ADMIN_MANAGE_STAFF)
  createStaff(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body: AdminStaffWriteInput,
  ): ReturnType<AdminStaffService["createStaff"]> {
    return this.staff.createStaff(body, actor);
  }

  @Post(":staffId/reset-pin")
  @RequireAction(ACTION.ADMIN_MANAGE_STAFF)
  resetStaffPin(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("staffId") staffId: string,
  ): ReturnType<AdminStaffService["resetStaffPin"]> {
    return this.staff.resetStaffPin(staffId, actor);
  }

  @Post(":staffId/deactivate")
  @RequireAction(ACTION.ADMIN_MANAGE_STAFF)
  deactivateStaff(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("staffId") staffId: string,
  ): ReturnType<AdminStaffService["deactivateStaff"]> {
    return this.staff.deactivateStaff(staffId, actor);
  }

  @Post(":staffId/reactivate")
  @RequireAction(ACTION.ADMIN_MANAGE_STAFF)
  reactivateStaff(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("staffId") staffId: string,
  ): ReturnType<AdminStaffService["reactivateStaff"]> {
    return this.staff.reactivateStaff(staffId, actor);
  }
}
