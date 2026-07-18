import { Injectable } from "@nestjs/common";
import { can, type Action, type ActorRole } from "@volt-rewards/domain";

@Injectable()
export class PoliciesService {
  can(actorRole: ActorRole, action: Action): boolean {
    return can(actorRole, action);
  }
}

