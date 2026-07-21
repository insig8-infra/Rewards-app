import { Controller, Get, NotFoundException, Param, Res, StreamableFile } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { getRailwayMediaObject } from "./media-storage.js";

@Controller("media")
export class MediaController {
  @Get("railway/:encodedKey")
  async getRailwayMedia(
    @Param("encodedKey") encodedKey: string,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<StreamableFile> {
    try {
      const media = await getRailwayMediaObject(encodedKey);
      response.header("Content-Type", media.contentType);
      response.header("Cache-Control", media.cacheControl);
      return new StreamableFile(media.buffer);
    } catch {
      throw new NotFoundException("Media asset not found.");
    }
  }
}
