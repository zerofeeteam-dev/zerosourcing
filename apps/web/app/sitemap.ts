import type { MetadataRoute } from "next";

import { blogPosts } from "./blog/blog-posts";
import { portfolioDetails } from "./portfolio/portfolio-items";
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
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...staticPaths,
    ...blogPosts.map((post) => `/blog/${post.slug}`),
    ...portfolioDetails.map((portfolio) => `/portfolio/${portfolio.slug}`),
  ];

  return paths.map((path) => ({
    url: new URL(path, `${SITE_URL}/`).toString(),
  }));
}
