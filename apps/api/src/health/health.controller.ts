import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): { status: "ok"; service: "volt-rewards-api" } {
    return { status: "ok", service: "volt-rewards-api" };
  }
}

