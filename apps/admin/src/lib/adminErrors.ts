import type { AdminSlug, AdminValidationIssue } from "./adminTypes";
import { assertNever } from "./adminTypes";
import type { SupabaseDisabledConfig } from "./supabase";

export const contentAssetValidationReasons = [
  "invalid_scope",
  "invalid_mime_type",
  "file_too_large",
  "invalid_relative_path",
  "mime_extension_mismatch",
  "invalid_storage_path",
  "insecure_public_url",
] as const;

export type ContentAssetValidationReason =
  (typeof contentAssetValidationReasons)[number];

export type ContentAssetValidationFailure = {
  readonly kind: "content_asset_validation";
  readonly message: string;
  readonly reason: ContentAssetValidationReason;
};

export type ContentAssetConflictFailure = {
  readonly kind: "content_asset_conflict";
  readonly message: string;
  readonly path: string;
};

export type ContentAssetCleanupFailure = {
  readonly kind: "content_asset_cleanup_failure";
  readonly message: string;
  readonly path: string;
};

export type ThumbnailCleanupFailure = {
  readonly kind: "thumbnail_cleanup_failure";
  readonly message: string;
  readonly path: string;
};

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
    }
  | ContentAssetValidationFailure
  | ContentAssetConflictFailure
  | ContentAssetCleanupFailure
  | ThumbnailCleanupFailure;

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

function contentAssetValidationMessage(
  reason: ContentAssetValidationReason,
): string {
  switch (reason) {
    case "invalid_scope":
      return "본문 asset scope가 올바르지 않습니다.";
    case "invalid_mime_type":
      return "본문 이미지는 PNG, JPEG, WEBP 형식만 업로드할 수 있습니다.";
    case "file_too_large":
      return "본문 이미지는 10 MiB 이하만 업로드할 수 있습니다.";
    case "invalid_relative_path":
      return "본문 asset 상대 경로가 올바르지 않습니다.";
    case "mime_extension_mismatch":
      return "본문 asset 파일 확장자와 이미지 형식이 일치하지 않습니다.";
    case "invalid_storage_path":
      return "Storage가 요청과 다른 본문 asset 경로를 반환했습니다.";
    case "insecure_public_url":
      return "본문 asset은 허용된 Storage 공개 URL이어야 합니다.";
    default:
      return assertNever(reason);
  }
}

export function contentAssetValidationFailure(
  reason: ContentAssetValidationReason,
): ContentAssetValidationFailure {
  return {
    kind: "content_asset_validation",
    message: contentAssetValidationMessage(reason),
    reason,
  };
}

export function contentAssetConflictFailure(
  path: string,
): ContentAssetConflictFailure {
  return {
    kind: "content_asset_conflict",
    message:
      "같은 경로의 본문 asset이 이미 존재합니다. 새 경로를 사용해 주세요.",
    path,
  };
}

export function contentAssetCleanupFailure(
  path: string,
): ContentAssetCleanupFailure {
  return {
    kind: "content_asset_cleanup_failure",
    message:
      "업로드된 본문 asset을 정리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    path,
  };
}

export function thumbnailCleanupFailure(path: string): ThumbnailCleanupFailure {
  return {
    kind: "thumbnail_cleanup_failure",
    message:
      "업로드된 썸네일을 정리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    path,
  };
}

export function saveFailure(): AdminFailure {
  return {
    kind: "save_failure",
    message: "관리자 데이터를 저장하지 못했습니다.",
  };
}

export function supabaseDisabledFailure(
  setup: SupabaseDisabledConfig,
): AdminFailure {
  return {
    kind: "supabase_disabled",
    message: setup.message,
    setup,
  };
}

export function validationFailure(
  issues: readonly AdminValidationIssue[],
): AdminFailure {
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
    case "content_asset_validation":
      return failure.message;
    case "content_asset_conflict":
      return failure.message;
    case "content_asset_cleanup_failure":
      return failure.message;
    case "thumbnail_cleanup_failure":
      return failure.message;
    default:
      return assertNever(failure);
  }
}
