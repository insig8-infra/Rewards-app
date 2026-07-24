import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ACTION } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import type { AdminStaffWriteInput } from "./admin-staff.repository.js";
import { AdminStaffService } from "./admin-staff.service.js";

@Controller("admin-web/admins")
@UseGuards(ActorGuard)
export class AdminWebAdminsController {
  constructor(private readonly staff: AdminStaffService) {}

  @Get()
  @RequireAction(ACTION.ADMIN_MANAGE_ADMINS)
  listAdmins(
    @CurrentActor() actor: AuthenticatedActor,
  ): ReturnType<AdminStaffService["listAdmins"]> {
    return this.staff.listAdmins(actor);
  }

  @Get(":adminId")
  @RequireAction(ACTION.ADMIN_MANAGE_ADMINS)
  getAdmin(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("adminId") adminId: string,
  ): ReturnType<AdminStaffService["getAdmin"]> {
    return this.staff.getAdmin(adminId, actor);
  }

  @Post()
  @RequireAction(ACTION.ADMIN_MANAGE_ADMINS)
  createAdmin(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body: AdminStaffWriteInput,
  ): ReturnType<AdminStaffService["createAdmin"]> {
    return this.staff.createAdmin(body, actor);
  }

  @Post(":adminId/reset-pin")
  @RequireAction(ACTION.ADMIN_MANAGE_ADMINS)
  resetAdminPin(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("adminId") adminId: string,
  ): ReturnType<AdminStaffService["resetAdminPin"]> {
    return this.staff.resetAdminPin(adminId, actor);
  }

  @Post(":adminId/deactivate")
  @RequireAction(ACTION.ADMIN_MANAGE_ADMINS)
  deactivateAdmin(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("adminId") adminId: string,
  ): ReturnType<AdminStaffService["deactivateAdmin"]> {
    return this.staff.deactivateAdmin(adminId, actor);
  }

  @Post(":adminId/reactivate")
  @RequireAction(ACTION.ADMIN_MANAGE_ADMINS)
  reactivateAdmin(
    @CurrentActor() actor: AuthenticatedActor,
    @Param("adminId") adminId: string,
  ): ReturnType<AdminStaffService["reactivateAdmin"]> {
    return this.staff.reactivateAdmin(adminId, actor);
  }
}
