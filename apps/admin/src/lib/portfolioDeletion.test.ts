import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PortfolioRow } from "./adminRepositoryTypes";
import {
  contentAssetCleanupFailure,
  saveFailure,
  thumbnailCleanupFailure,
} from "./adminErrors";
import { deletePortfolioWithStorageCleanup } from "./portfolioDeletion";
import type { SupabaseConfig } from "./supabase";

const mocks = vi.hoisted(() => ({
  deletePortfolio: vi.fn(),
  removeContentAssetScope: vi.fn(),
  removeThumbnail: vi.fn(),
}));

vi.mock("./portfolioRepository", () => ({
  deletePortfolio: mocks.deletePortfolio,
}));

vi.mock("./contentAssetStorage", () => ({
  removeContentAssetScope: mocks.removeContentAssetScope,
}));

vi.mock("./thumbnailStorage", () => ({
  removeThumbnail: mocks.removeThumbnail,
}));

const config = { kind: "enabled" } as SupabaseConfig;
const assetScope = "00000000-0000-4000-8000-000000000701";

function deletedPortfolio(
  thumbnailPath: string | null,
  bannerPath: string | null = null,
): PortfolioRow {
  return {
    banner_alt: "",
    banner_path: bannerPath,
    banner_public_url: null,
    company_name: "삭제할 포트폴리오",
    content: "<p>본문</p>",
    content_asset_base_enabled: false,
    content_asset_scope: assetScope,
    content_authoring_mode: "raw_html",
    content_json: null,
    content_mode: "html",
    content_schema_version: 1,
    content_source_backup: null,
    core_features: [],
    created_at: "2026-07-15T00:00:00.000Z",
    deleted_at: null,
    development_period: "",
    estimate_label: "",
    id: "00000000-0000-4000-8000-000000000702",
    landing_published: false,
    featured_published: false,
    landing_sections: {},
    product_description: "",
    published_at: null,
    seo_description: "",
    service_published: false,
    service_sections: {},
    slug: "delete-target",
    status: "draft",
    thumbnail_alt: "",
    thumbnail_path: thumbnailPath,
    thumbnail_public_url: null,
    title: "삭제할 포트폴리오",
    type: "mvp",
    updated_at: "2026-07-15T00:00:00.000Z",
    work_scopes: [],
  };
}

describe("deletePortfolioWithStorageCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps every Storage object when the row is not deleted", async () => {
    const failure = saveFailure();
    mocks.deletePortfolio.mockResolvedValue({ error: failure, ok: false });

    const outcome = await deletePortfolioWithStorageCleanup(
      config,
      "portfolio-id",
    );

    expect(outcome).toEqual({
      cleanupIssues: [],
      result: { error: failure, ok: false },
    });
    expect(mocks.removeContentAssetScope).not.toHaveBeenCalled();
    expect(mocks.removeThumbnail).not.toHaveBeenCalled();
  });

  it("removes the deleted Portfolio's scoped content images and thumbnail", async () => {
    const portfolio = deletedPortfolio("delete-target/thumbnail.webp");
    mocks.deletePortfolio.mockResolvedValue({ ok: true, value: portfolio });
    mocks.removeContentAssetScope.mockResolvedValue({ ok: true, value: [] });
    mocks.removeThumbnail.mockResolvedValue({ ok: true, value: null });

    const outcome = await deletePortfolioWithStorageCleanup(
      config,
      portfolio.id,
    );

    expect(mocks.deletePortfolio).toHaveBeenCalledWith(
      config,
      portfolio.id,
      {},
    );
    expect(mocks.removeContentAssetScope).toHaveBeenCalledWith(config, {
      assetScope,
      entity: "portfolio",
    });
    expect(mocks.removeThumbnail).toHaveBeenCalledWith(
      config,
      portfolio.thumbnail_path,
    );
    expect(outcome).toEqual({
      cleanupIssues: [],
      result: { ok: true, value: portfolio },
    });
  });

  it("removes the deleted Portfolio's banner image", async () => {
    const portfolio = deletedPortfolio(null, "delete-target/banner.webp");
    mocks.deletePortfolio.mockResolvedValue({ ok: true, value: portfolio });
    mocks.removeContentAssetScope.mockResolvedValue({ ok: true, value: [] });
    mocks.removeThumbnail.mockResolvedValue({ ok: true, value: null });

    const outcome = await deletePortfolioWithStorageCleanup(
      config,
      portfolio.id,
    );

    expect(mocks.removeThumbnail).toHaveBeenCalledWith(
      config,
      portfolio.banner_path,
    );
    expect(outcome.cleanupIssues).toEqual([]);
  });

  it("does not call thumbnail cleanup when the deleted Portfolio has no thumbnail", async () => {
    const portfolio = deletedPortfolio(null);
    mocks.deletePortfolio.mockResolvedValue({ ok: true, value: portfolio });
    mocks.removeContentAssetScope.mockResolvedValue({ ok: true, value: [] });

    const outcome = await deletePortfolioWithStorageCleanup(
      config,
      portfolio.id,
    );

    expect(mocks.removeContentAssetScope).toHaveBeenCalledOnce();
    expect(mocks.removeThumbnail).not.toHaveBeenCalled();
    expect(outcome.cleanupIssues).toEqual([]);
  });

  it("does not report a failed cleanup as a failed Portfolio deletion", async () => {
    const portfolio = deletedPortfolio("delete-target/thumbnail.webp");
    const contentFailure = contentAssetCleanupFailure(assetScope);
    const thumbnailFailure = thumbnailCleanupFailure(
      portfolio.thumbnail_path ?? "",
    );
    mocks.deletePortfolio.mockResolvedValue({ ok: true, value: portfolio });
    mocks.removeContentAssetScope.mockResolvedValue({
      error: contentFailure,
      ok: false,
    });
    mocks.removeThumbnail.mockResolvedValue({
      error: thumbnailFailure,
      ok: false,
    });

    const outcome = await deletePortfolioWithStorageCleanup(
      config,
      portfolio.id,
    );

    expect(outcome.result).toEqual({ ok: true, value: portfolio });
    expect(outcome.cleanupIssues).toEqual([
      {
        failure: contentFailure,
        path: assetScope,
        stage: "remove_content_assets",
      },
      {
        failure: thumbnailFailure,
        path: portfolio.thumbnail_path,
        stage: "remove_thumbnail",
      },
    ]);
  });
});
