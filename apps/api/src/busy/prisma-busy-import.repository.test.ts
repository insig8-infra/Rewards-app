import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import {
  BUSY_INTEGRATION_IMPORT_ACTION,
  BUSY_MOCK_IMPORT_ACTION,
  resolveBusyInvoiceImportAuditContext,
} from "./prisma-busy-import.repository.js";

test("real BUSY integration imports audit as backend integration work", () => {
  assert.deepEqual(resolveBusyInvoiceImportAuditContext({ role: ACTOR_ROLE.SYSTEM }), {
    actorRole: ACTOR_ROLE.SYSTEM,
    surface: "BACKEND_JOB",
    action: BUSY_INTEGRATION_IMPORT_ACTION,
  });
});

test("Admin Web mock BUSY imports keep Admin Web mock audit context", () => {
  assert.deepEqual(resolveBusyInvoiceImportAuditContext({ role: ACTOR_ROLE.OWNER, userId: "owner_1" }), {
    actorRole: ACTOR_ROLE.OWNER,
    surface: "ADMIN_WEB",
    action: BUSY_MOCK_IMPORT_ACTION,
  });
});

test("background mock sync keeps backend mock audit context", () => {
  assert.deepEqual(resolveBusyInvoiceImportAuditContext(), {
    actorRole: ACTOR_ROLE.SYSTEM,
    surface: "BACKEND_JOB",
    action: BUSY_MOCK_IMPORT_ACTION,
  });
});
