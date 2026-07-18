import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import { loadApiEnv } from "./env/load-api-env.js";

loadApiEnv();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? [
      "http://127.0.0.1:3001",
      "http://localhost:3001",
      "http://127.0.0.1:3002",
      "http://localhost:3002",
      "http://127.0.0.1:3003",
      "http://localhost:3003",
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  app.setGlobalPrefix("api");
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const host = process.env.HOST ?? (process.env.VERCEL ? undefined : "127.0.0.1");

  if (host) {
    await app.listen(port, host);
    return;
  }

  await app.listen(port);
}

await bootstrap();
