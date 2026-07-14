import assert from "node:assert/strict";
import test from "node:test";
import type { AdminFailure } from "./adminErrors";
import { adminFailureProvesRowWriteRejected } from "./adminWriteOutcome";

test("classifies failures that prove the row write was rejected", () => {
  const rejectedKinds = [
    "duplicate_slug",
    "permission_denied",
    "auth_expired",
    "supabase_disabled",
    "validation_failure",
  ] as const satisfies readonly AdminFailure["kind"][];

  for (const kind of rejectedKinds) {
    assert.equal(adminFailureProvesRowWriteRejected({ kind }), true, kind);
  }
});

test("treats Task 4 indeterminate and unrelated failures conservatively", () => {
  const indeterminateKinds = [
    "network_failure",
    "save_failure",
    "thumbnail_cleanup_failure",
    "upload_failure",
  ] as const satisfies readonly AdminFailure["kind"][];

  for (const kind of indeterminateKinds) {
    assert.equal(adminFailureProvesRowWriteRejected({ kind }), false, kind);
  }
});

test("retains the upload for an unknown future failure kind", () => {
  assert.equal(
    adminFailureProvesRowWriteRejected({ kind: "future_failure" }),
    false,
  );
});
