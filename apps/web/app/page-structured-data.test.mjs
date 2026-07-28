import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const serviceExpectations = [
  {
    file: "./service/mvp/page.tsx",
    id: "mvp-service-json-ld",
    name: "MVP 개발",
    path: "/service/mvp",
    serviceType: "MVP 개발",
  },
  {
    file: "./service/app/page.tsx",
    id: "app-service-json-ld",
    name: "하이브리드 앱 개발",
    path: "/service/app",
    serviceType: "앱 개발",
  },
  {
    file: "./service/company-homepage/page.tsx",
    id: "company-homepage-service-json-ld",
    name: "기업 홈페이지 제작",
    path: "/service/company-homepage",
    serviceType: "기업 홈페이지 제작",
  },
];

test("each routed service renders its own Service JSON-LD", async () => {
  for (const expectation of serviceExpectations) {
    const page = await readFile(
      new URL(expectation.file, import.meta.url),
      "utf8",
    );

    assert.match(page, /import \{ JsonLd \} from/);
    assert.match(page, /import \{ createServiceJsonLd \} from/);
    assert.match(page, /createServiceJsonLd\(\{/);
    assert.ok(page.includes(`name: ${JSON.stringify(expectation.name)}`));
    assert.ok(page.includes(`path: ${JSON.stringify(expectation.path)}`));
    assert.ok(
      page.includes(`serviceType: ${JSON.stringify(expectation.serviceType)}`),
    );
    assert.ok(page.includes(`id=${JSON.stringify(expectation.id)}`));
  }
});

test("blog detail builds BlogPosting and breadcrumbs after its notFound guard", async () => {
  const page = await readFile(
    new URL("./blog/[slug]/page.tsx", import.meta.url),
    "utf8",
  );

  for (const expected of [
    "createBlogPostingJsonLd({",
    "description: post.seoDescription || post.summary",
    "imageUrl: post.thumbnailUrl",
    "publishedDate: post.publishedDate",
    "updatedAt: post.updatedAt",
    'name: "Index"',
    'name: "Blog"',
    'id="blog-posting-json-ld"',
    'id="blog-breadcrumb-json-ld"',
  ]) {
    assert.ok(page.includes(expected), expected);
  }

  const guardPosition = page.indexOf("if (!post)");
  const schemaPosition = page.indexOf("createBlogPostingJsonLd({");
  assert.ok(guardPosition >= 0);
  assert.ok(schemaPosition > guardPosition);
});

test("portfolio detail builds breadcrumbs after its notFound guard", async () => {
  const page = await readFile(
    new URL("./portfolio/[slug]/page.tsx", import.meta.url),
    "utf8",
  );

  for (const expected of [
    "createBreadcrumbJsonLd([",
    'name: "Index"',
    'name: "Portfolio"',
    "path: `/portfolio/${portfolio.slug}`",
    'id="portfolio-breadcrumb-json-ld"',
  ]) {
    assert.ok(page.includes(expected), expected);
  }

  const guardPosition = page.indexOf("if (!portfolio)");
  const schemaPosition = page.indexOf("createBreadcrumbJsonLd([");
  assert.ok(guardPosition >= 0);
  assert.ok(schemaPosition > guardPosition);
  assert.doesNotMatch(page, /createBlogPostingJsonLd/);
});
