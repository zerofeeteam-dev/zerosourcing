import {
  getPublishedBlogPosts,
  getPublishedPortfolios,
} from "../../../lib/public-content/queries";
import { SITE_URL } from "../../site-metadata";

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
  "/privacy/consent",
] as const;

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sitemapEntry(path: string, lastModified?: string) {
  const location = new URL(path, `${SITE_URL}/`).toString();
  const lastModifiedElement = lastModified
    ? `\n    <lastmod>${escapeXml(lastModified)}</lastmod>`
    : "";

  return `  <url>\n    <loc>${escapeXml(location)}</loc>${lastModifiedElement}\n  </url>`;
}

export async function GET() {
  const [blogs, portfolios] = await Promise.all([
    getPublishedBlogPosts(),
    getPublishedPortfolios(),
  ]);
  const entries = [
    ...staticPaths.map((path) => sitemapEntry(path)),
    ...blogs.map((post) => sitemapEntry(`/blog/${post.slug}`, post.updatedAt)),
    ...portfolios.map((portfolio) =>
      sitemapEntry(`/portfolio/${portfolio.slug}`, portfolio.updatedAt),
    ),
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
