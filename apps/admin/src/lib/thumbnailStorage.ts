import { StorageApiError } from "@supabase/supabase-js";
import {
  authExpiredFailure,
  networkFailure,
  permissionDeniedFailure,
  supabaseDisabledFailure,
  uploadFailure,
} from "./adminErrors";
import type { AdminRepositoryResult } from "./adminRepositoryTypes";
import { adminErr, adminOk } from "./adminTypes";
import type { AdminSlug, AdminThumbnailFile } from "./adminTypes";
import type { SupabaseConfig } from "./supabase";

const defaultBlogThumbnailBucket = "zerosourcing";

function blogThumbnailBucket(): string {
  const configuredBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;

  if (typeof configuredBucket === "string" && configuredBucket.trim().length > 0) {
    return configuredBucket.trim();
  }

  return defaultBlogThumbnailBucket;
}

export type BlogThumbnailUploadInput = {
  readonly slug: AdminSlug;
  readonly thumbnail: AdminThumbnailFile;
};

export type BlogThumbnailUpload = {
  readonly path: string;
  readonly publicUrl: string;
};

function thumbnailExtension(mimeType: AdminThumbnailFile["mimeType"]): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
  }
}

function thumbnailPath(input: BlogThumbnailUploadInput): string {
  return `${input.slug.value}/${crypto.randomUUID()}.${thumbnailExtension(input.thumbnail.mimeType)}`;
}

function mapStorageError(error: StorageApiError) {
  if (error.status === 401) return authExpiredFailure();
  if (error.status === 403) return permissionDeniedFailure();
  if (error.status >= 500) return networkFailure();

  return uploadFailure();
}

export async function uploadBlogThumbnail(
  config: SupabaseConfig,
  input: BlogThumbnailUploadInput,
): Promise<AdminRepositoryResult<BlogThumbnailUpload>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  const path = thumbnailPath(input);
  const bucket = blogThumbnailBucket();
  const { data, error } = await config.client.storage.from(bucket).upload(path, input.thumbnail.file, {
    cacheControl: "31536000",
    contentType: input.thumbnail.mimeType,
    upsert: false,
  });

  if (error) {
    if (error instanceof StorageApiError) return adminErr(mapStorageError(error));
    return adminErr(uploadFailure());
  }

  const publicUrl = config.client.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;

  return adminOk({ path: data.path, publicUrl });
}

export async function removeBlogThumbnail(
  config: SupabaseConfig,
  path: string,
): Promise<AdminRepositoryResult<null>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));
  if (path.trim().length === 0) return adminOk(null);

  const { error } = await config.client.storage.from(blogThumbnailBucket()).remove([path]);

  if (error) {
    if (error instanceof StorageApiError) return adminErr(mapStorageError(error));
    return adminErr(uploadFailure());
  }

  return adminOk(null);
}
