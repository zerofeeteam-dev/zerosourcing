import "server-only";

import { cache } from "react";
import { fetchAllPublicRows, fetchPublicRows } from "./postgrest";
import {
  loadPublishedBlogPost,
  loadPublishedBlogPosts,
  loadPublishedPortfolio,
  loadPublishedPortfolios,
  type PublicContentReader,
} from "./queries-core";
import { selectRelatedBlogPosts, selectServicePortfolios } from "./selectors";
import type {
  BlogCard,
  BlogDetail,
  BlogType,
  PortfolioCard,
  PortfolioDetail,
  PortfolioType,
} from "./types";

const publicContentReader: PublicContentReader = {
  fetchAll: fetchAllPublicRows,
  fetchPage: fetchPublicRows,
};

export const getPublishedPortfolios = cache(
  (): Promise<readonly PortfolioCard[]> =>
    loadPublishedPortfolios(publicContentReader),
);

export const getPublishedPortfolio = cache(
  (slug: string): Promise<PortfolioDetail | null> =>
    loadPublishedPortfolio(publicContentReader, slug),
);

export const getPublishedBlogPosts = cache(
  (): Promise<readonly BlogCard[]> =>
    loadPublishedBlogPosts(publicContentReader),
);

export const getPublishedBlogPost = cache(
  (slug: string): Promise<BlogDetail | null> =>
    loadPublishedBlogPost(publicContentReader, slug),
);

export const getServicePortfolios = cache(
  async (type: PortfolioType): Promise<readonly PortfolioCard[]> =>
    selectServicePortfolios(await getPublishedPortfolios(), type),
);

export const getRelatedBlogPosts = cache(
  async (type: BlogType, slug: string): Promise<readonly BlogCard[]> =>
    selectRelatedBlogPosts(await getPublishedBlogPosts(), type, slug),
);
