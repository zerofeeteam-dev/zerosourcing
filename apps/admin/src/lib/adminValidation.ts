import type {
  AdminRequiredString,
  AdminResult,
  AdminSlug,
  AdminThumbnailFile,
  AdminThumbnailMimeType,
  AdminValidationIssue,
} from "./adminTypes";
import { adminErr, adminOk } from "./adminTypes";

const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const maxThumbnailSizeBytes = 50 * 1024 * 1024;

function validationIssue(
  code: AdminValidationIssue["code"],
  field: string,
  message: string,
): AdminValidationIssue {
  return { code, field, message };
}

export function parseRequiredAdminString(
  value: string,
  field: string,
): AdminResult<AdminRequiredString, AdminValidationIssue> {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return adminErr(validationIssue("required", field, "필수 입력값입니다."));
  }

  return adminOk({ value: trimmed });
}

export function parseAdminSlug(
  value: string,
  field: string,
): AdminResult<AdminSlug, AdminValidationIssue> {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return adminErr(validationIssue("required", field, "slug는 필수입니다."));
  }

  if (!slugPattern.test(trimmed)) {
    return adminErr(
      validationIssue(
        "invalid_slug",
        field,
        "slug는 1~80자의 영문 소문자, 숫자, 하이픈만 사용할 수 있으며 하이픈으로 시작하거나 끝날 수 없습니다.",
      ),
    );
  }

  return adminOk({ value: trimmed });
}

function parseThumbnailMimeType(
  mimeType: string,
  field: string,
): AdminResult<AdminThumbnailMimeType, AdminValidationIssue> {
  switch (mimeType) {
    case "image/png":
      return adminOk(mimeType);
    case "image/jpeg":
      return adminOk(mimeType);
    case "image/webp":
      return adminOk(mimeType);
    default:
      return adminErr(
        validationIssue(
          "invalid_thumbnail_type",
          field,
          "썸네일은 PNG, JPEG, WEBP 파일만 업로드할 수 있습니다.",
        ),
      );
  }
}

export function parseAdminThumbnailFile(
  file: File,
  field: string,
): AdminResult<AdminThumbnailFile, AdminValidationIssue> {
  const mimeTypeResult = parseThumbnailMimeType(file.type, field);

  if (!mimeTypeResult.ok) {
    return mimeTypeResult;
  }

  if (file.size > maxThumbnailSizeBytes) {
    return adminErr(
      validationIssue(
        "thumbnail_too_large",
        field,
        "썸네일은 50MB 이하만 업로드할 수 있습니다.",
      ),
    );
  }

  return adminOk({
    file,
    mimeType: mimeTypeResult.value,
    sizeBytes: file.size,
  });
}

export const adminThumbnailMaxSizeBytes = maxThumbnailSizeBytes;
