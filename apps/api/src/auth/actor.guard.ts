import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { can, type Action } from "@volt-rewards/domain";
import { parseActorFromHeaders, type RequestWithActor } from "./authenticated-actor.js";
import { MobileAuthService } from "./mobile-auth.service.js";
import { REQUIRED_ACTION_KEY } from "./require-action.decorator.js";

@Injectable()
export class ActorGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly mobileAuth?: MobileAuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const requiredAction = this.reflector.getAllAndOverride<Action>(REQUIRED_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAction) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const actor = parseActorFromHeaders(request.headers);
    if (actor) {
      assertPermittedActor(actor.role, requiredAction);
      request.actor = actor;
      return true;
    }

    const bearerToken = getBearerToken(request.headers);
    if (!bearerToken || !this.mobileAuth) {
      throw new UnauthorizedException("Authenticated actor headers or bearer session are required.");
    }

    return this.activateBearerActor(request, bearerToken, requiredAction);
  }

  private async activateBearerActor(
    request: RequestWithActor,
    bearerToken: string,
    requiredAction: Action,
  ): Promise<boolean> {
    const session = await this.mobileAuth?.resolveBearerActor(bearerToken);
    if (!session) {
      throw new UnauthorizedException("Bearer session is invalid or expired.");
    }

    assertPermittedActor(session.actor.role, requiredAction);
    request.actor = session.actor;
    return true;
  }
}

function assertPermittedActor(actorRole: Parameters<typeof can>[0], requiredAction: Action): void {
  if (!can(actorRole, requiredAction)) {
    throw new ForbiddenException("Actor is not permitted to perform this action.");
  }
}

function getBearerToken(headers: Record<string, string | string[] | undefined>): string | undefined {
  const authorization = headers.authorization ?? headers.Authorization;
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!value?.startsWith("Bearer ")) {
    return undefined;
  }
  return value.slice("Bearer ".length).trim();
}
