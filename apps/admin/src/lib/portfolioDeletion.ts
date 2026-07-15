import type { AdminFailure } from "./adminErrors";
import {
  removeContentAssetScope,
  type ContentAssetScopeRemoveInput,
} from "./contentAssetStorage";
import type {
  AdminRepositoryOptions,
  AdminRepositoryResult,
  PortfolioRow,
} from "./adminRepositoryTypes";
import { deletePortfolio } from "./portfolioRepository";
import type { SupabaseConfig } from "./supabase";
import { removeThumbnail } from "./thumbnailStorage";

export type PortfolioStorageCleanupIssue = {
  readonly failure: AdminFailure;
  readonly path: string;
  readonly stage: "remove_content_assets" | "remove_thumbnail";
};

export type PortfolioDeletionOutcome = {
  readonly cleanupIssues: readonly PortfolioStorageCleanupIssue[];
  readonly result: AdminRepositoryResult<PortfolioRow>;
};

function contentAssetInput(
  portfolio: PortfolioRow,
): ContentAssetScopeRemoveInput {
  return {
    assetScope: portfolio.content_asset_scope,
    entity: "portfolio",
  };
}

/**
 * Deletes the Portfolio row first, then removes only the Storage files owned
 * by that deleted record. Saving a draft or changing its visibility never
 * calls this function.
 */
export async function deletePortfolioWithStorageCleanup(
  config: SupabaseConfig,
  id: string,
  options: AdminRepositoryOptions = {},
): Promise<PortfolioDeletionOutcome> {
  const result = await deletePortfolio(config, id, options);
  if (!result.ok) return { cleanupIssues: [], result };

  const portfolio = result.value;
  const cleanupIssues: PortfolioStorageCleanupIssue[] = [];
  const [contentAssets, thumbnail] = await Promise.all([
    removeContentAssetScope(config, contentAssetInput(portfolio)),
    portfolio.thumbnail_path
      ? removeThumbnail(config, portfolio.thumbnail_path)
      : Promise.resolve(null),
  ]);

  if (!contentAssets.ok) {
    cleanupIssues.push({
      failure: contentAssets.error,
      path: portfolio.content_asset_scope,
      stage: "remove_content_assets",
    });
  }
  if (thumbnail && !thumbnail.ok) {
    cleanupIssues.push({
      failure: thumbnail.error,
      path: portfolio.thumbnail_path ?? "",
      stage: "remove_thumbnail",
    });
  }

  return { cleanupIssues, result };
}
