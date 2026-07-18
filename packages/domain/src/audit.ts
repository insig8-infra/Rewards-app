import type { ActorRole } from "./types.js";

export interface AuditEvent {
  readonly actorRole: ActorRole;
  readonly actorId: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly occurredAt: Date;
  readonly metadata?: Record<string, unknown>;
}

export function createAuditEvent(input: AuditEvent): AuditEvent {
  if (!input.actorId) {
    throw new Error("Audit actorId is required.");
  }
  if (!input.action) {
    throw new Error("Audit action is required.");
  }
  if (!input.targetType || !input.targetId) {
    throw new Error("Audit target is required.");
  }
  return input;
}
