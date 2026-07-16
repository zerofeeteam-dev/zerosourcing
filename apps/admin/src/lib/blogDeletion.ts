import type { AdminFailure } from "./adminErrors";
import {
  removeContentAssetScope,
  type ContentAssetScopeRemoveInput,
} from "./contentAssetStorage";
import type {
  AdminRepositoryOptions,
  AdminRepositoryResult,
  BlogPostRow,
} from "./adminRepositoryTypes";
import { deleteBlogPost } from "./blogRepository";
import type { SupabaseConfig } from "./supabase";
import { removeThumbnail } from "./thumbnailStorage";

export type BlogStorageCleanupIssue = {
  readonly failure: AdminFailure;
  readonly path: string;
  readonly stage:
    | "remove_banner"
    | "remove_content_assets"
    | "remove_thumbnail";
};

export type BlogDeletionOutcome = {
  readonly cleanupIssues: readonly BlogStorageCleanupIssue[];
  readonly result: AdminRepositoryResult<BlogPostRow>;
};

function contentAssetInput(
  blogPost: BlogPostRow,
): ContentAssetScopeRemoveInput {
  return {
    assetScope: blogPost.content_asset_scope,
    entity: "blog",
  };
}

/**
 * Deletes the Blog row first, then removes only the Storage files owned by
 * that deleted record. Saving a draft or changing its visibility never calls
 * this function.
 */
export async function deleteBlogPostWithStorageCleanup(
  config: SupabaseConfig,
  id: string,
  options: AdminRepositoryOptions = {},
): Promise<BlogDeletionOutcome> {
  const result = await deleteBlogPost(config, id, options);
  if (!result.ok) return { cleanupIssues: [], result };

  const blogPost = result.value;
  const cleanupIssues: BlogStorageCleanupIssue[] = [];
  const [contentAssets, thumbnail, banner] = await Promise.all([
    removeContentAssetScope(config, contentAssetInput(blogPost)),
    blogPost.thumbnail_path
      ? removeThumbnail(config, blogPost.thumbnail_path)
      : Promise.resolve(null),
    blogPost.banner_path
      ? removeThumbnail(config, blogPost.banner_path)
      : Promise.resolve(null),
  ]);

  if (!contentAssets.ok) {
    cleanupIssues.push({
      failure: contentAssets.error,
      path: blogPost.content_asset_scope,
      stage: "remove_content_assets",
    });
  }
  if (thumbnail && !thumbnail.ok) {
    cleanupIssues.push({
      failure: thumbnail.error,
      path: blogPost.thumbnail_path ?? "",
      stage: "remove_thumbnail",
    });
  }
  if (banner && !banner.ok) {
    cleanupIssues.push({
      failure: banner.error,
      path: blogPost.banner_path ?? "",
      stage: "remove_banner",
    });
  }

  return { cleanupIssues, result };
}
