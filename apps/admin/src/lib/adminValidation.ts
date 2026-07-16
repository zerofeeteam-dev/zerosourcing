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

export const adminThumbnailImageDimensions = {
  height: 720,
  width: 1080,
} as const;

type ImageDimensions = {
  readonly height: number;
  readonly width: number;
};

function imageNormalizationIssue(field: string): AdminValidationIssue {
  return validationIssue(
    "invalid_thumbnail_type",
    field,
    "이미지를 1080 × 720px로 자동 조정할 수 없습니다.",
  );
}

function cropToFill(image: ImageBitmap, dimensions: ImageDimensions) {
  const targetRatio = dimensions.width / dimensions.height;
  const sourceRatio = image.width / image.height;
  const sourceWidth =
    sourceRatio > targetRatio ? image.height * targetRatio : image.width;
  const sourceHeight =
    sourceRatio > targetRatio ? image.height : image.width / targetRatio;

  return {
    height: sourceHeight,
    width: sourceWidth,
    x: (image.width - sourceWidth) / 2,
    y: (image.height - sourceHeight) / 2,
  };
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  mimeType: AdminThumbnailMimeType,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      resolve,
      mimeType,
      mimeType === "image/png" ? undefined : 0.92,
    );
  });
}

export async function normalizeAdminThumbnailFile(
  thumbnail: AdminThumbnailFile,
  field: string,
  dimensions: ImageDimensions = adminThumbnailImageDimensions,
): Promise<AdminResult<AdminThumbnailFile, AdminValidationIssue>> {
  if (
    typeof createImageBitmap !== "function" ||
    typeof document === "undefined"
  ) {
    return adminOk(thumbnail);
  }

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(thumbnail.file);
  } catch {
    return adminErr(imageNormalizationIssue(field));
  }

  try {
    if (
      image.width === dimensions.width &&
      image.height === dimensions.height
    ) {
      return adminOk(thumbnail);
    }

    const canvas = document.createElement("canvas");
    canvas.height = dimensions.height;
    canvas.width = dimensions.width;
    const context = canvas.getContext("2d");
    if (!context) return adminErr(imageNormalizationIssue(field));

    const crop = cropToFill(image, dimensions);
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      dimensions.width,
      dimensions.height,
    );

    const blob = await canvasBlob(canvas, thumbnail.mimeType);
    if (!blob || blob.type !== thumbnail.mimeType) {
      return adminErr(imageNormalizationIssue(field));
    }

    return parseAdminThumbnailFile(
      new File([blob], thumbnail.file.name, {
        lastModified: thumbnail.file.lastModified,
        type: thumbnail.mimeType,
      }),
      field,
    );
  } catch {
    return adminErr(imageNormalizationIssue(field));
  } finally {
    image.close();
  }
}
