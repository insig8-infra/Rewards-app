import { Injectable } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { getRuntimeDatabaseUrl } from "../env/database-connection.js";
import { loadApiEnv } from "../env/load-api-env.js";
import { PrismaClient } from "../generated/prisma/client.js";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    loadApiEnv();

    const adapter = new PrismaPg({
      connectionString: getRuntimeDatabaseUrl(),
    });

    super({ adapter });
  }
}
