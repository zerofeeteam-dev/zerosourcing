import type { AdminSlug, AdminValidationIssue } from "./adminTypes";
import { assertNever } from "./adminTypes";
import type { SupabaseDisabledConfig } from "./supabase";

export type AdminFailure =
  | {
      readonly kind: "duplicate_slug";
      readonly message: string;
      readonly slug: AdminSlug;
    }
  | {
      readonly kind: "permission_denied";
      readonly message: string;
    }
  | {
      readonly kind: "auth_expired";
      readonly message: string;
    }
  | {
      readonly kind: "network_failure";
      readonly message: string;
    }
  | {
      readonly kind: "upload_failure";
      readonly message: string;
    }
  | {
      readonly kind: "save_failure";
      readonly message: string;
    }
  | {
      readonly kind: "supabase_disabled";
      readonly message: string;
      readonly setup: SupabaseDisabledConfig;
    }
  | {
      readonly kind: "validation_failure";
      readonly issues: readonly AdminValidationIssue[];
      readonly message: string;
    };

export class AdminFailureError extends Error {
  readonly name = "AdminFailureError";

  constructor(readonly failure: AdminFailure) {
    super(failure.message);
  }
}

export function duplicateSlugFailure(slug: AdminSlug): AdminFailure {
  return {
    kind: "duplicate_slug",
    message: "이미 사용 중인 slug입니다.",
    slug,
  };
}

export function permissionDeniedFailure(): AdminFailure {
  return {
    kind: "permission_denied",
    message: "관리자 권한이 없거나 RLS 정책에 의해 요청이 거부되었습니다.",
  };
}

export function authExpiredFailure(): AdminFailure {
  return {
    kind: "auth_expired",
    message: "관리자 세션이 만료되었습니다. 다시 로그인해 주세요.",
  };
}

export function networkFailure(): AdminFailure {
  return {
    kind: "network_failure",
    message: "네트워크 연결 문제로 요청을 완료하지 못했습니다.",
  };
}

export function uploadFailure(): AdminFailure {
  return {
    kind: "upload_failure",
    message: "파일 업로드에 실패했습니다.",
  };
}

export function saveFailure(): AdminFailure {
  return {
    kind: "save_failure",
    message: "관리자 데이터를 저장하지 못했습니다.",
  };
}

export function supabaseDisabledFailure(setup: SupabaseDisabledConfig): AdminFailure {
  return {
    kind: "supabase_disabled",
    message: setup.message,
    setup,
  };
}

export function validationFailure(issues: readonly AdminValidationIssue[]): AdminFailure {
  return {
    kind: "validation_failure",
    issues,
    message: "입력값을 확인해 주세요.",
  };
}

export function adminFailureMessage(failure: AdminFailure): string {
  switch (failure.kind) {
    case "duplicate_slug":
      return failure.message;
    case "permission_denied":
      return failure.message;
    case "auth_expired":
      return failure.message;
    case "network_failure":
      return failure.message;
    case "upload_failure":
      return failure.message;
    case "save_failure":
      return failure.message;
    case "supabase_disabled":
      return failure.message;
    case "validation_failure":
      return failure.message;
    default:
      return assertNever(failure);
  }
}
