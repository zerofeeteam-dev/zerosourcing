import {
  mapBlogCard,
  mapBlogDetail,
  mapPortfolioCard,
  mapPortfolioDetail,
} from "./mappers";
import type { PublicContentReadInput } from "./postgrest-core";
import { isPublicSlug } from "./public-slug";
import type {
  BlogCard,
  BlogDetail,
  PortfolioCard,
  PortfolioDetail,
} from "./types";

const publicFilters = {
  deleted_at: "is.null",
  status: "eq.published",
} as const;

const publicOrder = "published_at.desc,created_at.desc,slug.asc";

const portfolioCardSelect =
  "slug,title,type,product_description,estimate_label,development_period,core_features,work_scopes,thumbnail_public_url,thumbnail_alt,landing_published,service_published,updated_at";
const portfolioDetailSelect = `${portfolioCardSelect},content_mode,content_authoring_mode,content,content_asset_scope,content_asset_base_enabled,seo_description`;
const blogCardSelect =
  "slug,title,type,summary,published_date,thumbnail_public_url,thumbnail_alt,landing_published,banner_published,published_at,updated_at";
const blogDetailSelect = `${blogCardSelect},content_mode,content_authoring_mode,content,content_asset_scope,content_asset_base_enabled,seo_description`;

export type PublicContentReader = {
  readonly fetchAll: (
    input: PublicContentReadInput,
  ) => Promise<readonly unknown[]>;
  readonly fetchPage: (
    input: PublicContentReadInput,
  ) => Promise<readonly unknown[]>;
};

export async function loadPublishedPortfolios(
  reader: PublicContentReader,
): Promise<readonly PortfolioCard[]> {
  const rows = await reader.fetchAll({
    table: "portfolios",
    query: {
      ...publicFilters,
      order: publicOrder,
      select: portfolioCardSelect,
    },
  });
  return rows.map(mapPortfolioCard);
}

export async function loadPublishedPortfolio(
  reader: PublicContentReader,
  slug: string,
): Promise<PortfolioDetail | null> {
  if (!isPublicSlug(slug)) return null;

  const rows = await reader.fetchPage({
    table: "portfolios",
    query: {
      ...publicFilters,
      limit: "1",
      select: portfolioDetailSelect,
      slug: `eq.${slug}`,
    },
  });
  return rows[0] === undefined ? null : mapPortfolioDetail(rows[0]);
}

export async function loadPublishedBlogPosts(
  reader: PublicContentReader,
): Promise<readonly BlogCard[]> {
  const rows = await reader.fetchAll({
    table: "blog_posts",
    query: {
      ...publicFilters,
      order: publicOrder,
      select: blogCardSelect,
    },
  });
  return rows.map(mapBlogCard);
}

export async function loadPublishedBlogPost(
  reader: PublicContentReader,
  slug: string,
): Promise<BlogDetail | null> {
  if (!isPublicSlug(slug)) return null;

  const rows = await reader.fetchPage({
    table: "blog_posts",
    query: {
      ...publicFilters,
      limit: "1",
      select: blogDetailSelect,
      slug: `eq.${slug}`,
    },
  });
  return rows[0] === undefined ? null : mapBlogDetail(rows[0]);
}
