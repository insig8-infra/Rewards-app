import { Inject, Injectable } from "@nestjs/common";
import type { ActorRole } from "@volt-rewards/domain";
import {
  ADMIN_WEB_DASHBOARD_REPOSITORY,
  type AdminWebDashboard,
  type AdminWebDashboardRepository,
} from "./admin-web-dashboard.repository.js";

@Injectable()
export class AdminWebDashboardService {
  constructor(
    @Inject(ADMIN_WEB_DASHBOARD_REPOSITORY)
    private readonly repository: AdminWebDashboardRepository,
  ) {}

  getDashboard(actorRole: ActorRole): Promise<AdminWebDashboard> {
    return this.repository.getDashboard(actorRole);
  }
}
