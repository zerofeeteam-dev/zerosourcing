import type { ContentEntity } from "../../lib/contentAssetStorage";
import { isContentImagePublicUrlOwnedBy } from "../../lib/contentAssetStorage";
import type { ManagedContentInput } from "../../lib/adminRepositoryTypes";
import { managedContentImagePublishIssues } from "../../lib/managedContent";
import type { SupabaseConfig } from "../../lib/supabase";

type PublishCandidate = ManagedContentInput & {
  readonly status: "draft" | "published";
};

export function firstManagedContentPublishIssue(
  candidate: PublishCandidate,
  isAllowedImageUrl: (url: string) => boolean,
): string | undefined {
  if (
    candidate.status !== "published" ||
    candidate.contentAuthoringMode !== "wysiwyg"
  ) {
    return undefined;
  }

  return managedContentImagePublishIssues(
    candidate.contentJson,
    isAllowedImageUrl,
  )[0]?.message;
}

export function validateManagedContentImagesForPublish(
  config: SupabaseConfig,
  entity: ContentEntity,
  candidate: PublishCandidate,
): string | undefined {
  return firstManagedContentPublishIssue(candidate, (publicUrl) =>
    isContentImagePublicUrlOwnedBy(config, {
      assetScope: candidate.contentAssetScope,
      entity,
      publicUrl,
    }),
  );
}
