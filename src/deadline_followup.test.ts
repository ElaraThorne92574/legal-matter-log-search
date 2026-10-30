import test from "node:test";
import assert from "node:assert/strict";
import { shouldFollowUp } from "./deadline_followup.ts";

test("signed matter inside the three-day window gets a follow-up", () => {
  assert.equal(shouldFollowUp({ matterId: "matter-17", clientName: "Northstar Media", signedDocumentDelivered: true, deadline: "2026-10-26" }, "2026-10-24"), true);
  assert.equal(shouldFollowUp({ matterId: "matter-17", clientName: "Northstar Media", signedDocumentDelivered: false, deadline: "2026-10-26" }, "2026-10-24"), false);
});
