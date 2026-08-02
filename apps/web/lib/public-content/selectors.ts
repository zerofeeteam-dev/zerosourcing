import type { BlogType, PortfolioType } from "./types";

export function selectHomePortfolios<
  T extends { readonly landingPublished: boolean },
>(rows: readonly T[]): readonly T[] {
  return rows.filter((row) => row.landingPublished).slice(0, 6);
}

export function selectHomeBlogPosts<
  T extends { readonly landingPublished: boolean },
>(rows: readonly T[]): readonly T[] {
  return rows.filter((row) => row.landingPublished).slice(0, 3);
}

export function selectPortfolioIndex<
  T extends { readonly featuredPublished: boolean },
>(
  rows: readonly T[],
): {
  readonly featured: T | null;
  readonly list: readonly T[];
} {
  const featuredIndex = rows.findIndex((row) => row.featuredPublished);
  return {
    featured: featuredIndex >= 0 ? (rows[featuredIndex] ?? null) : null,
    list: rows,
  };
}

export function selectBlogIndex<
  T extends { readonly bannerPublished: boolean },
>(
  rows: readonly T[],
): {
  readonly featured: T | null;
  readonly list: readonly T[];
  readonly top: readonly T[];
} {
  const bannerIndex = rows.findIndex((row) => row.bannerPublished);
  const featuredIndex =
    bannerIndex >= 0 ? bannerIndex : rows.length > 0 ? 0 : -1;
  const featured = featuredIndex >= 0 ? (rows[featuredIndex] ?? null) : null;
  const top = rows.slice(0, 3);
  return {
    featured,
    list: rows,
    top,
  };
}

export function selectServicePortfolios<
  T extends {
    readonly servicePublished: boolean;
    readonly type: PortfolioType;
  },
>(rows: readonly T[], type: PortfolioType): readonly T[] {
  return rows
    .filter((row) => row.servicePublished && row.type === type)
    .slice(0, 3);
}

export function selectRelatedBlogPosts<
  T extends { readonly slug: string; readonly type: BlogType },
>(rows: readonly T[], type: BlogType, slug: string): readonly T[] {
  return rows
    .filter((row) => row.type === type && row.slug !== slug)
    .slice(0, 3);
}
