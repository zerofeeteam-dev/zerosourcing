import {
  CONTENT_STORAGE_BUCKET,
  ContentAssetScopeError,
  contentAssetObjectPrefix,
  createContentAssetBaseUrl,
  isExactPublicStorageObjectUrl,
  parseAllowedAssetHttpUrl,
  parseContentAssetScope,
  type ContentEntity,
} from "@repo/content/asset-url";
import { StorageApiError } from "@supabase/supabase-js";
import {
  authExpiredFailure,
  contentAssetCleanupFailure,
  contentAssetConflictFailure,
  contentAssetValidationFailure,
  networkFailure,
  permissionDeniedFailure,
  supabaseDisabledFailure,
  uploadFailure,
  type AdminFailure,
} from "./adminErrors";
import type { AdminRepositoryResult } from "./adminRepositoryTypes";
import { adminErr, adminOk } from "./adminTypes";
import type { SupabaseConfig } from "./supabase";

export type { ContentEntity } from "@repo/content/asset-url";

export type ContentAssetUploadInput = {
  readonly assetScope: string;
  readonly entity: ContentEntity;
  readonly file: File;
};

export type RawHtmlAssetUploadInput = ContentAssetUploadInput & {
  readonly relativePath: string;
};

export type ContentAssetRemoveInput = {
  readonly assetScope: string;
  readonly entity: ContentEntity;
  readonly path: string;
};

export type ContentAssetOwnership = {
  readonly assetScope: string;
  readonly entity: ContentEntity;
  readonly path: string;
  readonly publicUrl: string;
};

export type ContentImageAssetUpload = ContentAssetOwnership & {
  readonly alt: string;
};

export type ContentImagePublicUrlOwnershipInput = {
  readonly assetScope: string;
  readonly entity: ContentEntity;
  readonly publicUrl: string;
};

export type RawHtmlAssetUpload = ContentAssetOwnership & {
  readonly relativePath: string;
};

type EnabledSupabaseConfig = Extract<
  SupabaseConfig,
  { readonly kind: "enabled" }
>;
type StorageBucketClient = ReturnType<
  EnabledSupabaseConfig["client"]["storage"]["from"]
>;

type ValidatedAssetLocation = {
  readonly assetScope: string;
  readonly prefix: string;
};

type ImageFormat = {
  readonly extension: "jpg" | "png" | "webp";
  readonly rawExtensions: readonly string[];
};

const allowedImageFormats = new Map<string, ImageFormat>([
  ["image/png", { extension: "png", rawExtensions: ["png"] }],
  ["image/jpeg", { extension: "jpg", rawExtensions: ["jpg", "jpeg"] }],
  ["image/webp", { extension: "webp", rawExtensions: ["webp"] }],
]);

const maxRelativePathLength = 512;
const maxRelativePathSegmentLength = 128;
const unsafeRelativePathCharacters = /[\\:%?#]/u;
const unsafeUnicodeCategories = /[\p{Cc}\p{Cs}]/u;

export const contentImageMaxSizeBytes = 10 * 1024 * 1024;

export function adminContentAssetBaseUrl(
  config: SupabaseConfig,
  entity: ContentEntity,
  assetScope: string,
): string | undefined {
  if (config.kind === "disabled") return undefined;

  return createContentAssetBaseUrl({
    assetScope,
    entity,
    supabaseUrl: config.url,
  });
}

function validateAssetLocation(
  entity: ContentEntity,
  assetScope: string,
): AdminRepositoryResult<ValidatedAssetLocation> {
  try {
    const canonicalScope = parseContentAssetScope(assetScope);
    return adminOk({
      assetScope: canonicalScope,
      prefix: contentAssetObjectPrefix(entity, canonicalScope),
    });
  } catch (error) {
    if (error instanceof ContentAssetScopeError) {
      return adminErr(contentAssetValidationFailure("invalid_scope"));
    }

    throw error;
  }
}

function validateImageFile(file: File): AdminRepositoryResult<ImageFormat> {
  const format = allowedImageFormats.get(file.type);
  if (!format) {
    return adminErr(contentAssetValidationFailure("invalid_mime_type"));
  }
  if (file.size > contentImageMaxSizeBytes) {
    return adminErr(contentAssetValidationFailure("file_too_large"));
  }

  return adminOk(format);
}

function safeRelativeAssetPath(value: string): string | null {
  if (
    value.length === 0 ||
    value.length > maxRelativePathLength ||
    value.startsWith("/") ||
    unsafeRelativePathCharacters.test(value) ||
    unsafeUnicodeCategories.test(value)
  ) {
    return null;
  }

  const segments = value.split("/");
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.length > maxRelativePathSegmentLength,
    )
  ) {
    return null;
  }

  return value;
}

function isExactObjectPath(prefix: string, path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith(prefix)) return false;

  return safeRelativeAssetPath(path.slice(prefix.length)) !== null;
}

function publicUrlMatchesObject(
  value: unknown,
  configUrl: string,
  path: string,
): value is string {
  return isExactPublicStorageObjectUrl(value, {
    objectPath: path,
    supabaseUrl: configUrl,
  });
}

const immutableContentImageNamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/u;

/**
 * Exact ownership predicate used by the editor and publish validation. Raw
 * assets are intentionally excluded: WYSIWYG images always use immutable UUID
 * filenames directly below the scope's images directory.
 */
export function isContentImagePublicUrlOwnedBy(
  config: SupabaseConfig,
  input: ContentImagePublicUrlOwnershipInput,
): boolean {
  if (config.kind === "disabled") return false;

  let scope: string;
  try {
    scope = parseContentAssetScope(input.assetScope);
  } catch {
    return false;
  }

  const prefix = `${contentAssetObjectPrefix(input.entity, scope)}images/`;
  const parsedUrl = parseAllowedAssetHttpUrl(input.publicUrl);
  if (!parsedUrl) return false;

  const storagePrefix = `/storage/v1/object/public/${CONTENT_STORAGE_BUCKET}/${prefix}`;
  if (!parsedUrl.pathname.startsWith(storagePrefix)) return false;
  const fileName = parsedUrl.pathname.slice(storagePrefix.length);
  if (!immutableContentImageNamePattern.test(fileName)) return false;

  return publicUrlMatchesObject(
    input.publicUrl,
    config.url,
    `${prefix}${fileName}`,
  );
}

function storageApiFailure(
  error: StorageApiError,
  path: string,
  operation: "cleanup" | "upload",
) {
  if (error.status === 401) return authExpiredFailure();
  if (error.status === 403) return permissionDeniedFailure();
  if (error.status === 409) {
    return operation === "upload"
      ? contentAssetConflictFailure(path)
      : contentAssetCleanupFailure(path);
  }
  if (error.status >= 500) return networkFailure();
  if (operation === "cleanup") return contentAssetCleanupFailure(path);
  return uploadFailure();
}

function isStatuslessStorageUnknownError(error: unknown): boolean {
  if (!(error instanceof Error) || error.name !== "StorageUnknownError") {
    return false;
  }

  return (error as Error & { readonly status?: unknown }).status === undefined;
}

function storageResponseFailure(
  error: unknown,
  path: string,
  operation: "cleanup" | "upload",
): AdminFailure {
  if (error instanceof StorageApiError) {
    return storageApiFailure(error, path, operation);
  }
  if (isStatuslessStorageUnknownError(error)) return networkFailure();
  if (operation === "cleanup") return contentAssetCleanupFailure(path);
  return uploadFailure();
}

async function removeExactObject(
  bucket: StorageBucketClient,
  path: string,
  failureMode: "compensation" | "explicit",
): Promise<AdminRepositoryResult<null>> {
  let response: Awaited<ReturnType<typeof bucket.remove>>;
  try {
    response = await bucket.remove([path]);
  } catch (error) {
    if (failureMode === "compensation") {
      return adminErr(contentAssetCleanupFailure(path));
    }
    if (error instanceof StorageApiError) {
      return adminErr(storageApiFailure(error, path, "cleanup"));
    }
    if (isStatuslessStorageUnknownError(error)) {
      return adminErr(networkFailure());
    }
    return adminErr(contentAssetCleanupFailure(path));
  }

  if (response.error) {
    if (failureMode === "compensation") {
      return adminErr(contentAssetCleanupFailure(path));
    }
    return adminErr(storageResponseFailure(response.error, path, "cleanup"));
  }

  return adminOk(null);
}

async function rejectUploadedObject(
  bucket: StorageBucketClient,
  path: string,
  failure: AdminFailure,
): Promise<AdminRepositoryResult<never>> {
  const cleanup = await removeExactObject(bucket, path, "compensation");
  if (!cleanup.ok) return cleanup;
  return adminErr(failure);
}

async function uploadExactAsset(
  config: EnabledSupabaseConfig,
  input: ContentAssetUploadInput,
  location: ValidatedAssetLocation,
  path: string,
): Promise<
  AdminRepositoryResult<Pick<ContentAssetOwnership, "path" | "publicUrl">>
> {
  const bucket = config.client.storage.from(CONTENT_STORAGE_BUCKET);
  let response: Awaited<ReturnType<typeof bucket.upload>>;
  try {
    response = await bucket.upload(path, input.file, {
      cacheControl: "31536000",
      contentType: input.file.type,
      upsert: false,
    });
  } catch (error) {
    if (error instanceof StorageApiError) {
      return adminErr(storageApiFailure(error, path, "upload"));
    }
    if (isStatuslessStorageUnknownError(error)) {
      return adminErr(networkFailure());
    }
    return adminErr(networkFailure());
  }

  if (response.error) {
    return adminErr(storageResponseFailure(response.error, path, "upload"));
  }

  const returnedPath: unknown = response.data?.path;
  if (
    returnedPath !== path ||
    !isExactObjectPath(location.prefix, returnedPath)
  ) {
    return rejectUploadedObject(
      bucket,
      path,
      contentAssetValidationFailure("invalid_storage_path"),
    );
  }

  let publicUrl: unknown;
  try {
    publicUrl = bucket.getPublicUrl(returnedPath).data.publicUrl;
  } catch {
    return rejectUploadedObject(bucket, path, uploadFailure());
  }
  if (!publicUrlMatchesObject(publicUrl, config.url, returnedPath)) {
    return rejectUploadedObject(
      bucket,
      path,
      contentAssetValidationFailure("insecure_public_url"),
    );
  }

  return adminOk({ path: returnedPath, publicUrl });
}

function provisionalImageAlt(fileName: string): string {
  return fileName.replace(/\.[^.]+$/u, "");
}

export async function uploadContentAsset(
  config: SupabaseConfig,
  input: ContentAssetUploadInput,
): Promise<AdminRepositoryResult<ContentImageAssetUpload>> {
  if (config.kind === "disabled") {
    return adminErr(supabaseDisabledFailure(config));
  }

  const location = validateAssetLocation(input.entity, input.assetScope);
  if (!location.ok) return location;
  const imageFormat = validateImageFile(input.file);
  if (!imageFormat.ok) return imageFormat;

  const path =
    `${location.value.prefix}images/` +
    `${crypto.randomUUID().toLowerCase()}.${imageFormat.value.extension}`;
  const uploaded = await uploadExactAsset(config, input, location.value, path);
  if (!uploaded.ok) return uploaded;

  return adminOk({
    alt: provisionalImageAlt(input.file.name),
    assetScope: location.value.assetScope,
    entity: input.entity,
    ...uploaded.value,
  });
}

export async function uploadRawHtmlAsset(
  config: SupabaseConfig,
  input: RawHtmlAssetUploadInput,
): Promise<AdminRepositoryResult<RawHtmlAssetUpload>> {
  if (config.kind === "disabled") {
    return adminErr(supabaseDisabledFailure(config));
  }

  const location = validateAssetLocation(input.entity, input.assetScope);
  if (!location.ok) return location;
  const imageFormat = validateImageFile(input.file);
  if (!imageFormat.ok) return imageFormat;
  const relativePath = safeRelativeAssetPath(input.relativePath);
  if (!relativePath) {
    return adminErr(contentAssetValidationFailure("invalid_relative_path"));
  }

  const suffix = relativePath
    .split("/")
    .at(-1)
    ?.split(".")
    .at(-1)
    ?.toLowerCase();
  if (!suffix || !imageFormat.value.rawExtensions.includes(suffix)) {
    return adminErr(contentAssetValidationFailure("mime_extension_mismatch"));
  }

  const path = `${location.value.prefix}${relativePath}`;
  const uploaded = await uploadExactAsset(config, input, location.value, path);
  if (!uploaded.ok) return uploaded;

  return adminOk({
    assetScope: location.value.assetScope,
    entity: input.entity,
    relativePath,
    ...uploaded.value,
  });
}

export async function removeContentAsset(
  config: SupabaseConfig,
  input: ContentAssetRemoveInput,
): Promise<AdminRepositoryResult<null>> {
  if (config.kind === "disabled") {
    return adminErr(supabaseDisabledFailure(config));
  }

  const location = validateAssetLocation(input.entity, input.assetScope);
  if (!location.ok) return location;
  if (!isExactObjectPath(location.value.prefix, input.path)) {
    return adminErr(contentAssetValidationFailure("invalid_storage_path"));
  }

  const bucket = config.client.storage.from(CONTENT_STORAGE_BUCKET);
  return removeExactObject(bucket, input.path, "explicit");
}
