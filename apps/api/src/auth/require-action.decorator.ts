import { SetMetadata } from "@nestjs/common";
import type { Action } from "@volt-rewards/domain";

export const REQUIRED_ACTION_KEY = "volt_rewards_required_action";

export function RequireAction(action: Action) {
  return SetMetadata(REQUIRED_ACTION_KEY, action);
}
