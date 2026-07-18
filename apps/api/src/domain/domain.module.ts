import { Module } from "@nestjs/common";
import { DomainPreviewController } from "./domain-preview.controller.js";
import { DomainPreviewService } from "./domain-preview.service.js";

@Module({
  controllers: [DomainPreviewController],
  providers: [DomainPreviewService],
  exports: [DomainPreviewService],
})
export class DomainModule {}

