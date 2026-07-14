import {
  CONTENT_STORAGE_BUCKET,
  isExactPublicStorageObjectUrl,
} from "@repo/content/asset-url";
import { StorageApiError } from "@supabase/supabase-js";
import {
  authExpiredFailure,
  networkFailure,
  permissionDeniedFailure,
  supabaseDisabledFailure,
  thumbnailCleanupFailure,
  uploadFailure,
  type AdminFailure,
} from "./adminErrors";
import type { AdminRepositoryResult } from "./adminRepositoryTypes";
import { adminErr, adminOk } from "./adminTypes";
import type { AdminSlug, AdminThumbnailFile } from "./adminTypes";
import { adminThumbnailMaxSizeBytes } from "./adminValidation";
import type { SupabaseConfig } from "./supabase";

export type ThumbnailUploadInput = {
  readonly slug: AdminSlug;
  readonly thumbnail: AdminThumbnailFile;
};

export type ThumbnailUpload = {
  readonly path: string;
  readonly publicUrl: string;
};

/** @deprecated Use ThumbnailUploadInput. */
export type BlogThumbnailUploadInput = ThumbnailUploadInput;

/** @deprecated Use ThumbnailUpload. */
export type BlogThumbnailUpload = ThumbnailUpload;

type EnabledSupabaseConfig = Extract<
  SupabaseConfig,
  { readonly kind: "enabled" }
>;
type StorageBucketClient = ReturnType<
  EnabledSupabaseConfig["client"]["storage"]["from"]
>;

const thumbnailFormats = new Map<
  AdminThumbnailFile["mimeType"],
  "jpg" | "png" | "webp"
>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);
const thumbnailSlugPattern = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/u;
const legacyThumbnailPathPattern =
  /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/u;

type StorageOperation = "cleanup" | "upload";

type StorageResponseBoundary =
  | {
      readonly kind: "error";
      readonly error: unknown;
    }
  | {
      readonly kind: "malformed";
    }
  | {
      readonly data: unknown;
      readonly kind: "success";
    };

function storageResponseBoundary(value: unknown): StorageResponseBoundary {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "malformed" };
  }
  try {
    const record = value as Readonly<Record<string, unknown>>;
    if (!Object.prototype.hasOwnProperty.call(record, "error")) {
      return { kind: "malformed" };
    }
    const error = record.error;
    if (error === null) {
      return { data: record.data, kind: "success" };
    }
    if (error === undefined) return { kind: "malformed" };
    return { error, kind: "error" };
  } catch {
    return { kind: "malformed" };
  }
}

function storageUploadPath(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  try {
    const path = (data as Readonly<Record<string, unknown>>).path;
    return typeof path === "string" ? path : null;
  } catch {
    return null;
  }
}

function storageApiFailure(
  error: StorageApiError,
  operation: StorageOperation,
  path: string,
): AdminFailure {
  if (error.status === 401) return authExpiredFailure();
  if (error.status === 403) return permissionDeniedFailure();
  if (error.status >= 500) return networkFailure();

  return operation === "cleanup"
    ? thumbnailCleanupFailure(path)
    : uploadFailure();
}

function isStatuslessStorageUnknownError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "StorageUnknownError" &&
    (error as Error & { readonly status?: unknown }).status === undefined
  );
}

function storageFailure(
  error: unknown,
  operation: StorageOperation,
  path: string,
  thrown: boolean,
): AdminFailure {
  if (error instanceof StorageApiError) {
    return storageApiFailure(error, operation, path);
  }
  if (isStatuslessStorageUnknownError(error)) return networkFailure();
  if (thrown && error instanceof TypeError) return networkFailure();
  return operation === "cleanup"
    ? thumbnailCleanupFailure(path)
    : uploadFailure();
}

function publicUrlMatchesThumbnail(
  value: unknown,
  configUrl: string,
  path: string,
): value is string {
  return isExactPublicStorageObjectUrl(value, {
    objectPath: path,
    supabaseUrl: configUrl,
  });
}

function validatedThumbnailPath(input: ThumbnailUploadInput): string | null {
  const extension = thumbnailFormats.get(input.thumbnail.mimeType);
  const file = input.thumbnail.file;
  if (
    !extension ||
    !thumbnailSlugPattern.test(input.slug.value) ||
    input.thumbnail.sizeBytes !== file.size ||
    input.thumbnail.sizeBytes > adminThumbnailMaxSizeBytes ||
    file.type !== input.thumbnail.mimeType
  ) {
    return null;
  }

  return `${input.slug.value}/${crypto.randomUUID()}.${extension}`;
}

async function removeLegacyThumbnailObject(
  bucket: StorageBucketClient,
  path: string,
): Promise<AdminRepositoryResult<null>> {
  let response: unknown;
  try {
    response = await bucket.remove([path]);
  } catch (error) {
    return adminErr(storageFailure(error, "cleanup", path, true));
  }

  const boundary = storageResponseBoundary(response);
  if (boundary.kind === "malformed") {
    return adminErr(thumbnailCleanupFailure(path));
  }
  if (boundary.kind === "error") {
    return adminErr(storageFailure(boundary.error, "cleanup", path, false));
  }
  return adminOk(null);
}

async function rejectUploadedThumbnail(
  bucket: StorageBucketClient,
  path: string,
  failure: AdminFailure,
): Promise<AdminRepositoryResult<never>> {
  const cleanup = await removeLegacyThumbnailObject(bucket, path);
  if (!cleanup.ok) {
    // Compensation failure takes precedence because the uploaded object may
    // still exist even when the underlying cause was auth or network related.
    return adminErr(thumbnailCleanupFailure(path));
  }
  return adminErr(failure);
}

export async function uploadThumbnail(
  config: SupabaseConfig,
  input: ThumbnailUploadInput,
): Promise<AdminRepositoryResult<ThumbnailUpload>> {
  if (config.kind === "disabled") {
    return adminErr(supabaseDisabledFailure(config));
  }

  const path = validatedThumbnailPath(input);
  if (!path) return adminErr(uploadFailure());

  const bucket = config.client.storage.from(CONTENT_STORAGE_BUCKET);
  let response: unknown;
  try {
    response = await bucket.upload(path, input.thumbnail.file, {
      cacheControl: "31536000",
      contentType: input.thumbnail.mimeType,
      upsert: false,
    });
  } catch (error) {
    return adminErr(storageFailure(error, "upload", path, true));
  }
  const boundary = storageResponseBoundary(response);
  if (boundary.kind === "error") {
    return adminErr(storageFailure(boundary.error, "upload", path, false));
  }
  if (boundary.kind === "malformed") {
    return rejectUploadedThumbnail(bucket, path, uploadFailure());
  }
  const returnedPath = storageUploadPath(boundary.data);
  if (returnedPath !== path) {
    return rejectUploadedThumbnail(bucket, path, uploadFailure());
  }

  let publicUrl: unknown;
  try {
    publicUrl = bucket.getPublicUrl(path).data.publicUrl;
  } catch {
    return rejectUploadedThumbnail(bucket, path, uploadFailure());
  }
  if (!publicUrlMatchesThumbnail(publicUrl, config.url, path)) {
    return rejectUploadedThumbnail(bucket, path, uploadFailure());
  }

  return adminOk({ path, publicUrl });
}

export async function removeThumbnail(
  config: SupabaseConfig,
  path: string,
): Promise<AdminRepositoryResult<null>> {
  if (config.kind === "disabled") {
    return adminErr(supabaseDisabledFailure(config));
  }
  if (path.trim().length === 0) return adminOk(null);
  if (!legacyThumbnailPathPattern.test(path)) {
    return adminErr(thumbnailCleanupFailure(path));
  }

  const bucket = config.client.storage.from(CONTENT_STORAGE_BUCKET);
  return removeLegacyThumbnailObject(bucket, path);
}

/** @deprecated Use uploadThumbnail. */
export const uploadBlogThumbnail = uploadThumbnail;

/** @deprecated Use removeThumbnail. */
export const removeBlogThumbnail = removeThumbnail;
