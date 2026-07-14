import type { AdminFailure } from "./adminErrors";

type AdminFailureLike =
  | Pick<AdminFailure, "kind">
  | { readonly kind: string };

export function adminFailureProvesRowWriteRejected(
  failure: AdminFailureLike,
): boolean {
  switch (failure.kind) {
    case "duplicate_slug":
    case "permission_denied":
    case "auth_expired":
    case "supabase_disabled":
    case "validation_failure":
      return true;
    case "network_failure":
    case "save_failure":
    case "upload_failure":
      return false;
    default:
      // A future failure may be reported after the database committed. Retain the
      // upload unless that failure is deliberately added to the allowlist above.
      return false;
  }
}
