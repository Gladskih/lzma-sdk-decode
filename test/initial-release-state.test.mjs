import assert from "node:assert/strict";
import { test } from "node:test";
import { initialReleaseState } from "../scripts/initial-release-state.mjs";

test("never retries before npm's exact 24-hour hold expires", () => {
  assert.equal(initialReleaseState(Date.parse("2026-10-26T20:50:12.844Z"), false), "waiting");
  assert.equal(initialReleaseState(Date.parse("2026-10-26T20:50:12.845Z"), false), "ready");
});

test("recovery stops once published and does not repeat in later years", () => {
  assert.equal(initialReleaseState(Date.parse("2026-10-26T20:57:00Z"), true), "published");
  assert.equal(initialReleaseState(Date.parse("2026-10-27T20:00:00Z"), false), "expired");
  assert.equal(initialReleaseState(Date.parse("2027-10-26T20:57:00Z"), false), "expired");
});
