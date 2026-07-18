import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedActor, RequestWithActor } from "./authenticated-actor.js";

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedActor | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    return request.actor;
  },
);
