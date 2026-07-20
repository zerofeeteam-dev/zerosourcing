import type { MetadataRoute } from "next";

import {
  getPublishedBlogPosts,
  getPublishedPortfolios,
} from "../lib/public-content/queries";
import { SITE_URL } from "./site-metadata";

const staticPaths = [
  "/",
  "/service/mvp",
  "/service/app",
  "/service/company-homepage",
  "/about",
  "/blog",
  "/portfolio",
  "/faq",
  "/contact",
  "/term",
  "/privacy",
] as const;

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, portfolios] = await Promise.all([
    getPublishedBlogPosts(),
    getPublishedPortfolios(),
  ]);
  const staticEntries = staticPaths.map((path) => ({
    url: new URL(path, `${SITE_URL}/`).toString(),
  }));
  const dynamicEntries = [
    ...blogs.map((post) => ({
      lastModified: post.updatedAt,
      path: `/blog/${post.slug}`,
    })),
    ...portfolios.map((portfolio) => ({
      lastModified: portfolio.updatedAt,
      path: `/portfolio/${portfolio.slug}`,
    })),
  ].map(({ lastModified, path }) => ({
    lastModified,
    url: new URL(path, `${SITE_URL}/`).toString(),
  }));

  return [...staticEntries, ...dynamicEntries];
}
