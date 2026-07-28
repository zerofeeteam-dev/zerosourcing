import "server-only";

import {
  getPublishedBlogPosts,
  getPublishedPortfolios,
} from "../public-content/queries";
import type { LlmsPublicContent } from "./llms-content";

export async function loadLlmsPublicContent(): Promise<LlmsPublicContent> {
  const [blogsResult, portfoliosResult] = await Promise.allSettled([
    getPublishedBlogPosts(),
    getPublishedPortfolios(),
  ]);
  const unavailableSources: ("blog" | "portfolio")[] = [];

  if (blogsResult.status === "rejected") unavailableSources.push("blog");
  if (portfoliosResult.status === "rejected") {
    unavailableSources.push("portfolio");
  }

  return {
    blogs: blogsResult.status === "fulfilled" ? blogsResult.value : [],
    portfolios:
      portfoliosResult.status === "fulfilled" ? portfoliosResult.value : [],
    unavailableSources,
  };
}
