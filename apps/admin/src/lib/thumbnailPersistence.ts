import { saveFailure, type AdminFailure } from "./adminErrors";
import type { AdminRepositoryResult } from "./adminRepositoryTypes";
import { adminFailureProvesRowWriteRejected } from "./adminWriteOutcome";
import { adminErr } from "./adminTypes";
import type { AdminSlug, AdminThumbnailFile } from "./adminTypes";
import type { SupabaseConfig } from "./supabase";
import { removeThumbnail, uploadThumbnail } from "./thumbnailStorage";

export type ThumbnailReference = {
  readonly path: string | null;
  readonly publicUrl: string | null;
};

export type ThumbnailCleanupIssue = {
  readonly failure: AdminFailure;
  readonly path: string;
  readonly stage: "remove_replaced_upload" | "rollback_new_upload";
};

export type ThumbnailPersistenceOutcome<TValue> = {
  readonly cleanupIssues: readonly ThumbnailCleanupIssue[];
  /** The primary upload/save outcome; cleanup warnings never replace it. */
  readonly result: AdminRepositoryResult<TValue>;
};

export type PersistThumbnailChangeInput<TValue> = {
  readonly config: SupabaseConfig;
  readonly current: ThumbnailReference;
  readonly removed: boolean;
  readonly save: (
    next: ThumbnailReference,
    secondaryNext?: ThumbnailReference,
  ) => Promise<AdminRepositoryResult<TValue>>;
  readonly secondary?: {
    readonly current: ThumbnailReference;
    readonly removed: boolean;
    readonly selected?: AdminThumbnailFile;
  };
  /** A selected file takes precedence over a stale removed flag. */
  readonly selected?: AdminThumbnailFile;
  readonly slug: AdminSlug;
};

function cleanupIssue(
  failure: AdminFailure,
  path: string,
  stage: ThumbnailCleanupIssue["stage"],
): ThumbnailCleanupIssue {
  return { failure, path, stage };
}

export async function persistThumbnailChange<TValue>({
  config,
  current,
  removed,
  save,
  secondary,
  selected,
  slug,
}: PersistThumbnailChangeInput<TValue>): Promise<
  ThumbnailPersistenceOutcome<TValue>
> {
  const cleanupIssues: ThumbnailCleanupIssue[] = [];
  let next = removed ? { path: null, publicUrl: null } : current;
  let secondaryNext = secondary
    ? secondary.removed
      ? { path: null, publicUrl: null }
      : secondary.current
    : undefined;
  let uploadedPath: string | undefined;
  let secondaryUploadedPath: string | undefined;

  if (selected) {
    const uploaded = await uploadThumbnail(config, {
      slug,
      thumbnail: selected,
    });
    if (!uploaded.ok) {
      return { cleanupIssues, result: uploaded };
    }
    uploadedPath = uploaded.value.path;
    next = {
      path: uploaded.value.path,
      publicUrl: uploaded.value.publicUrl,
    };
  }

  if (secondary?.selected) {
    const uploaded = await uploadThumbnail(config, {
      slug,
      thumbnail: secondary.selected,
    });
    if (!uploaded.ok) {
      if (uploadedPath) {
        const rollback = await removeThumbnail(config, uploadedPath);
        if (!rollback.ok) {
          cleanupIssues.push(
            cleanupIssue(rollback.error, uploadedPath, "rollback_new_upload"),
          );
        }
      }
      return { cleanupIssues, result: uploaded };
    }
    secondaryUploadedPath = uploaded.value.path;
    secondaryNext = {
      path: uploaded.value.path,
      publicUrl: uploaded.value.publicUrl,
    };
  }

  let result: AdminRepositoryResult<TValue>;
  try {
    result = await save(next, secondaryNext);
  } catch {
    // A rejected adapter promise gives no proof that the server declined the
    // write. Keep a newly uploaded object because the row may have committed.
    result = adminErr(saveFailure());
  }
  if (!result.ok) {
    // Network/abort/unknown failures may arrive after the row committed. Only
    // the shared definite-rejection allowlist authorizes destructive rollback.
    if (
      uploadedPath &&
      uploadedPath !== current.path &&
      adminFailureProvesRowWriteRejected(result.error)
    ) {
      const rollback = await removeThumbnail(config, uploadedPath);
      if (!rollback.ok) {
        cleanupIssues.push(
          cleanupIssue(rollback.error, uploadedPath, "rollback_new_upload"),
        );
      }
    }
    if (
      secondaryUploadedPath &&
      secondaryUploadedPath !== secondary?.current.path &&
      adminFailureProvesRowWriteRejected(result.error)
    ) {
      const rollback = await removeThumbnail(config, secondaryUploadedPath);
      if (!rollback.ok) {
        cleanupIssues.push(
          cleanupIssue(
            rollback.error,
            secondaryUploadedPath,
            "rollback_new_upload",
          ),
        );
      }
    }

    return { cleanupIssues, result };
  }

  const oldPath = current.path;
  if (oldPath && oldPath !== next.path) {
    const cleanup = await removeThumbnail(config, oldPath);
    if (!cleanup.ok) {
      cleanupIssues.push(
        cleanupIssue(cleanup.error, oldPath, "remove_replaced_upload"),
      );
    }
  }

  const oldSecondaryPath = secondary?.current.path;
  if (oldSecondaryPath && oldSecondaryPath !== secondaryNext?.path) {
    const cleanup = await removeThumbnail(config, oldSecondaryPath);
    if (!cleanup.ok) {
      cleanupIssues.push(
        cleanupIssue(cleanup.error, oldSecondaryPath, "remove_replaced_upload"),
      );
    }
  }

  return { cleanupIssues, result };
}
