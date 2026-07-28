# Page-Specific Structured Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accurate, page-specific `Service`, `BlogPosting`, and `BreadcrumbList` JSON-LD to the public web app without changing visible UI.

**Architecture:** Keep the existing site-wide `Organization` node as the canonical provider identity, add pure structured-data builders plus one safe server-rendered JSON-LD component, and let each route build schemas from the same public data already used for its metadata and visible content. Dynamic detail pages create JSON-LD only after their record passes the existing `notFound()` guard, so missing or unpublished content never receives indexable schema.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript 5.9, Vitest 4.1, Node test runner, Schema.org JSON-LD

## Global Constraints

- This plan does not include Search Console or Naver Search Advisor work; site ownership and sitemap submission are already complete.
- Make no visible UI, CSS, typography, icon, asset, or interaction changes. If implementation expands into linked/visible breadcrumbs, pause and read `design.md` before that UI work.
- Keep `https://www.zerosourcing.kr` and `https://www.zerosourcing.kr/#organization` as the canonical site and provider identities.
- Add no new runtime dependency; use narrow local TypeScript types and plain JSON-LD objects.
- Structured data must describe public page content only. Do not invent prices, currencies, availability, ratings, reviews, testimonials, or offers.
- Use the stored publication date and modification timestamp; never parse the display string `YYYY. MM. DD` back into a schema date.
- Include an article image only when the blog record has a real public thumbnail URL. Do not substitute the generic OG image, logo, or a placeholder.
- Preserve the existing `<` escaping when serializing JSON-LD so record-controlled text cannot terminate the script element.
- Keep the existing root `Organization` JSON-LD and connect the three routed services to it with stable `@id` references.
- `Service` is included for entity understanding and Schema.org validity; do not claim that it creates a Google rich result.

---

## Scope and non-goals

In scope:

- `/service/mvp`: one `Service` node.
- `/service/app`: one `Service` node.
- `/service/company-homepage`: one `Service` node.
- `/blog/[slug]`: one `BlogPosting` node and one `BreadcrumbList` node.
- `/portfolio/[slug]`: one `BreadcrumbList` node.
- The existing root `Organization` offer catalog: stable `@id` links for the three routed services.

Out of scope:

- FAQ structured data.
- A portfolio-specific `CreativeWork`, `Product`, or review schema.
- Visible breadcrumb redesign or navigation changes.
- Per-page Open Graph image generation.
- Database migrations. The needed blog dates and thumbnail URL are already selected by the public query.
- Reconciliation of the separate checked-in migration drift around banner columns; this work relies only on the existing thumbnail URL.

## Standards references

- Google Article/BlogPosting guidance: <https://developers.google.com/search/docs/appearance/structured-data/article>
- Google BreadcrumbList guidance: <https://developers.google.com/search/docs/appearance/structured-data/breadcrumb>
- Schema.org Service: <https://schema.org/Service>
- Schema.org validator: <https://validator.schema.org/>
- Google Rich Results Test: <https://search.google.com/test/rich-results>

## File structure

| File                                                 | Responsibility                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `apps/web/lib/public-content/types.ts`               | Preserve a raw ISO publication date on the public blog model.                             |
| `apps/web/lib/public-content/mappers.ts`             | Derive both the visible date and raw schema date from the same validated source.          |
| `apps/web/lib/public-content/public-content.test.ts` | Lock the blog date mapping and fallback behavior.                                         |
| `apps/web/lib/seo/structured-data.ts`                | Own canonical URLs, stable node IDs, schema builders, and safe JSON serialization.        |
| `apps/web/lib/seo/structured-data.test.ts`           | Assert exact Service, BlogPosting, BreadcrumbList, optional-image, and escaping behavior. |
| `apps/web/components/JsonLd.tsx`                     | Render one inert server-side `<script type="application/ld+json">` element.               |
| `apps/web/app/layout.tsx`                            | Render the existing Organization schema through the shared component.                     |
| `apps/web/app/site-metadata.test.mjs`                | Keep the root Organization rendering and shared serializer regression coverage.           |
| `apps/web/app/organization-json-ld.json`             | Give the three routed service catalog entries the same `@id` as their page nodes.         |
| `apps/web/app/organization-json-ld.test.mjs`         | Verify the service entity IDs remain aligned with public routes.                          |
| `apps/web/app/organization-json-ld.md`               | Document the new service `@id` property.                                                  |
| `apps/web/app/service/mvp/page.tsx`                  | Render the MVP `Service` node.                                                            |
| `apps/web/app/service/app/page.tsx`                  | Render the hybrid-app `Service` node.                                                     |
| `apps/web/app/service/company-homepage/page.tsx`     | Render the company-homepage `Service` node.                                               |
| `apps/web/app/blog/[slug]/page.tsx`                  | Render BlogPosting and blog breadcrumbs from the resolved post.                           |
| `apps/web/app/portfolio/[slug]/page.tsx`             | Render portfolio breadcrumbs from the resolved portfolio.                                 |
| `apps/web/app/page-structured-data.test.mjs`         | Assert every intended route is wired to the correct builders after its content guard.     |

---

### Task 1: Preserve the canonical blog publication date

**Files:**

- Modify: `apps/web/lib/public-content/types.ts:43`
- Modify: `apps/web/lib/public-content/mappers.ts:282`
- Test: `apps/web/lib/public-content/public-content.test.ts:406`

**Interfaces:**

- Consumes: validated `published_date` and `published_at` values already selected by `blogCardSelect`.
- Produces: `BlogCard.publishedDate: string`, an ISO `YYYY-MM-DD` value matching the date displayed to readers.

- [ ] **Step 1: Write the failing mapper assertions**

Add `publishedDate` to the existing blog detail expectation and assert the `published_at` fallback preserves both forms:

```ts
expect(mapBlogDetail(blogRow())).toMatchObject({
  assetBaseEnabled: false,
  assetScope: canonicalAssetScope,
  author: "제로소싱",
  bannerAlt: "블로그 배너 이미지",
  bannerUrl: "https://cdn.example.com/blog-banner.png",
  category: "인사이트",
  contentAuthoringMode: "wysiwyg",
  date: "2026. 07. 12",
  publishedDate: "2026-07-12",
  thumbnailUrl: null,
});

expect(mapBlogCard(blogRow({ published_date: null }))).toMatchObject({
  date: "2026. 07. 13",
  publishedDate: "2026-07-13",
});
```

- [ ] **Step 2: Run the mapper test and verify it fails**

Run:

```bash
pnpm --filter web exec vitest run lib/public-content/public-content.test.ts
```

Expected: FAIL because the mapped blog object does not yet contain `publishedDate`.

- [ ] **Step 3: Add the public field and map it from the validated source**

Add the field beside the existing display date in `BlogCard`:

```ts
export type BlogCard = {
  readonly bannerAlt: string;
  readonly bannerPublished: boolean;
  readonly bannerUrl: string | null;
  readonly category: string;
  readonly date: string;
  readonly landingPublished: boolean;
  readonly publishedDate: string;
  readonly slug: string;
  readonly summary: string;
  readonly thumbnailAlt: string;
  readonly thumbnailUrl: string | null;
  readonly title: string;
  readonly type: BlogType;
  readonly updatedAt: string;
};
```

Replace the local date calculation in `mapBlogCard` with one canonical value used for both outputs:

```ts
export function mapBlogCard(value: unknown): BlogCard {
  const row = record(value);
  const type = enumField(row, "type", blogTypes);
  const publishedAt = timestampField(row, "published_at");
  const publishedDate =
    nullableDateField(row, "published_date") ?? publishedAt.slice(0, 10);

  return {
    bannerAlt: stringField(row, "banner_alt"),
    bannerPublished: booleanField(row, "banner_published"),
    bannerUrl: nullableStringField(row, "banner_public_url"),
    category: blogCategory(type),
    date: displayDate(publishedDate),
    landingPublished: booleanField(row, "landing_published"),
    publishedDate,
    slug: slugField(row, "slug"),
    summary: stringField(row, "summary"),
    thumbnailAlt: stringField(row, "thumbnail_alt"),
    thumbnailUrl: nullableStringField(row, "thumbnail_public_url"),
    title: stringField(row, "title"),
    type,
    updatedAt: timestampField(row, "updated_at"),
  };
}
```

Do not change `blogCardSelect`; it already includes both source columns.

- [ ] **Step 4: Run the focused unit test**

Run:

```bash
pnpm --filter web exec vitest run lib/public-content/public-content.test.ts
```

Expected: PASS, including the invalid-date boundary tests.

- [ ] **Step 5: Commit the independently testable date contract**

```bash
git add apps/web/lib/public-content/types.ts apps/web/lib/public-content/mappers.ts apps/web/lib/public-content/public-content.test.ts
git commit -m "feat(web): preserve blog publication date"
```

---

### Task 2: Add shared JSON-LD builders and a safe renderer

**Files:**

- Create: `apps/web/lib/seo/structured-data.ts`
- Create: `apps/web/lib/seo/structured-data.test.ts`
- Create: `apps/web/components/JsonLd.tsx`
- Modify: `apps/web/app/layout.tsx:30`
- Modify: `apps/web/app/site-metadata.test.mjs:105`

**Interfaces:**

- Consumes: `SITE_URL` from `apps/web/app/site-metadata.ts` and plain route-owned data.
- Produces: `ORGANIZATION_ID`, `createServiceJsonLd`, `createBlogPostingJsonLd`, `createBreadcrumbJsonLd`, `serializeJsonLd`, and `<JsonLd id data />`.

- [ ] **Step 1: Write failing behavioral tests for every builder**

Create `apps/web/lib/seo/structured-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  ORGANIZATION_ID,
  createBlogPostingJsonLd,
  createBreadcrumbJsonLd,
  createServiceJsonLd,
  serializeJsonLd,
} from "./structured-data";

const organizationReference = {
  "@type": "Organization",
  "@id": "https://www.zerosourcing.kr/#organization",
  name: "제로소싱",
  url: "https://www.zerosourcing.kr",
};

describe("page-specific structured data", () => {
  it("builds a routed Service connected to the canonical organization", () => {
    expect(ORGANIZATION_ID).toBe("https://www.zerosourcing.kr/#organization");
    expect(
      createServiceJsonLd({
        description: "핵심 기능만 담아 검증하는 개발 서비스",
        name: "MVP 개발",
        path: "/service/mvp",
        serviceType: "MVP 개발",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.zerosourcing.kr/service/mvp#service",
      areaServed: {
        "@type": "Country",
        name: "대한민국",
      },
      description: "핵심 기능만 담아 검증하는 개발 서비스",
      name: "MVP 개발",
      provider: organizationReference,
      serviceType: "MVP 개발",
      url: "https://www.zerosourcing.kr/service/mvp",
    });
  });

  it("builds ordered absolute breadcrumbs", () => {
    expect(
      createBreadcrumbJsonLd([
        { name: "Index", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: "글 제목", path: "/blog/example" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          item: "https://www.zerosourcing.kr/",
          name: "Index",
          position: 1,
        },
        {
          "@type": "ListItem",
          item: "https://www.zerosourcing.kr/blog",
          name: "Blog",
          position: 2,
        },
        {
          "@type": "ListItem",
          item: "https://www.zerosourcing.kr/blog/example",
          name: "글 제목",
          position: 3,
        },
      ],
    });
  });

  it("builds a BlogPosting and emits only a record-owned image", () => {
    const input = {
      category: "MVP",
      description: "MVP 준비 체크리스트",
      publishedDate: "2026-07-12",
      slug: "mvp-checklist",
      title: "MVP 개발 전 준비할 것",
      updatedAt: "2026-07-14T01:02:03+00:00",
    } as const;

    expect(createBlogPostingJsonLd({ ...input, imageUrl: null })).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "https://www.zerosourcing.kr/blog/mvp-checklist#blog-posting",
      articleSection: "MVP",
      author: organizationReference,
      dateModified: "2026-07-14T01:02:03+00:00",
      datePublished: "2026-07-12",
      description: "MVP 준비 체크리스트",
      headline: "MVP 개발 전 준비할 것",
      inLanguage: "ko-KR",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://www.zerosourcing.kr/blog/mvp-checklist",
      },
      publisher: organizationReference,
      url: "https://www.zerosourcing.kr/blog/mvp-checklist",
    });

    expect(
      createBlogPostingJsonLd({
        ...input,
        imageUrl: "https://cdn.example.com/mvp-checklist.webp",
      }),
    ).toMatchObject({
      image: ["https://cdn.example.com/mvp-checklist.webp"],
    });
  });

  it("escapes less-than characters before embedding JSON in HTML", () => {
    const serialized = serializeJsonLd({
      name: "</script><script>alert(1)</script>",
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});
```

- [ ] **Step 2: Run the new unit test and verify it fails**

Run:

```bash
pnpm --filter web exec vitest run lib/seo/structured-data.test.ts
```

Expected: FAIL because `lib/seo/structured-data.ts` does not exist.

- [ ] **Step 3: Implement the pure builders and serializer**

Create `apps/web/lib/seo/structured-data.ts`:

```ts
import { SITE_URL } from "../../app/site-metadata";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const organizationReference = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "제로소싱",
  url: SITE_URL,
} as const;

type ServiceJsonLdInput = {
  readonly description: string;
  readonly name: string;
  readonly path: string;
  readonly serviceType: string;
};

type BlogPostingJsonLdInput = {
  readonly category: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly publishedDate: string;
  readonly slug: string;
  readonly title: string;
  readonly updatedAt: string;
};

type BreadcrumbItem = {
  readonly name: string;
  readonly path: string;
};

type BreadcrumbItems = readonly [
  BreadcrumbItem,
  BreadcrumbItem,
  ...BreadcrumbItem[],
];

function createSiteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function createServiceJsonLd({
  description,
  name,
  path,
  serviceType,
}: ServiceJsonLdInput) {
  const url = createSiteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    areaServed: {
      "@type": "Country",
      name: "대한민국",
    },
    description,
    name,
    provider: organizationReference,
    serviceType,
    url,
  } as const;
}

export function createBreadcrumbJsonLd(items: BreadcrumbItems) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem",
      item: createSiteUrl(path),
      name,
      position: index + 1,
    })),
  } as const;
}

export function createBlogPostingJsonLd({
  category,
  description,
  imageUrl,
  publishedDate,
  slug,
  title,
  updatedAt,
}: BlogPostingJsonLdInput) {
  const url = createSiteUrl(`/blog/${slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blog-posting`,
    articleSection: category,
    author: organizationReference,
    dateModified: updatedAt,
    datePublished: publishedDate,
    description,
    headline: title,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    inLanguage: "ko-KR",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    publisher: organizationReference,
    url,
  } as const;
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
```

- [ ] **Step 4: Create the shared server-rendered script component**

Create `apps/web/components/JsonLd.tsx`:

```tsx
import { serializeJsonLd } from "../lib/seo/structured-data";

type JsonLdProps = {
  readonly data: unknown;
  readonly id: string;
};

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      id={id}
      type="application/ld+json"
    />
  );
}
```

Do not add `"use client"`; JSON-LD must be present in the server HTML without hydration logic.

- [ ] **Step 5: Migrate the existing Organization script to the shared renderer**

In `apps/web/app/layout.tsx`, import the component:

```tsx
import { JsonLd } from "../components/JsonLd";
```

Delete `organizationJsonLdString` and replace the handwritten script with:

```tsx
<JsonLd data={organizationJsonLd} id="organization-json-ld" />
```

Update the root-layout assertion in `apps/web/app/site-metadata.test.mjs` so it validates the shared path instead of requiring `JSON.stringify` to remain inside `layout.tsx`:

```js
test("the root layout supplies Korean defaults and Organization JSON-LD", async () => {
  const [layout, jsonLd] = await Promise.all([
    readOrEmpty("./layout.tsx"),
    readOrEmpty("../components/JsonLd.tsx"),
  ]);

  assert.match(layout, /metadataBase: new URL\(SITE_URL\)/);
  assert.match(layout, /createPageMetadata/);
  assert.match(layout, /organization-json-ld\.json/);
  assert.match(layout, /import \{ JsonLd \} from "\.\.\/components\/JsonLd";/);
  assert.match(
    layout,
    /<JsonLd data=\{organizationJsonLd\} id="organization-json-ld" \/>/,
  );
  assert.match(jsonLd, /serializeJsonLd\(data\)/);
  assert.match(jsonLd, /type="application\/ld\+json"/);
  assert.match(layout, /<html lang="ko">/);
  assert.doesNotMatch(layout, /Create Next App|Generated by create next app/);
});
```

- [ ] **Step 6: Run focused unit and Node tests**

Run:

```bash
pnpm --filter web exec vitest run lib/seo/structured-data.test.ts
pnpm --filter web exec node --test app/site-metadata.test.mjs app/organization-json-ld.test.mjs
```

Expected: both commands PASS; the rendered Organization data remains unchanged.

- [ ] **Step 7: Commit the shared foundation**

```bash
git add apps/web/lib/seo/structured-data.ts apps/web/lib/seo/structured-data.test.ts apps/web/components/JsonLd.tsx apps/web/app/layout.tsx apps/web/app/site-metadata.test.mjs
git commit -m "feat(web): add structured data builders"
```

---

### Task 3: Render Service JSON-LD on the three service routes

**Files:**

- Create: `apps/web/app/page-structured-data.test.mjs`
- Modify: `apps/web/app/organization-json-ld.json:64`
- Modify: `apps/web/app/organization-json-ld.test.mjs:62`
- Modify: `apps/web/app/organization-json-ld.md:70`
- Modify: `apps/web/app/service/mvp/page.tsx:10`
- Modify: `apps/web/app/service/app/page.tsx:12`
- Modify: `apps/web/app/service/company-homepage/page.tsx:10`

**Interfaces:**

- Consumes: `createServiceJsonLd`, `JsonLd`, the existing service page title/description/path, and the canonical Organization node.
- Produces: three stable service entities ending in `#service`, referenced from both the service page and Organization offer catalog.

- [ ] **Step 1: Write the failing service wiring test**

Create `apps/web/app/page-structured-data.test.mjs`:

```js
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
```

Extend `apps/web/app/organization-json-ld.test.mjs` with the stable ID assertion:

```js
assert.deepEqual(
  offers.slice(0, 3).map(({ itemOffered }) => itemOffered["@id"]),
  [
    "https://www.zerosourcing.kr/service/mvp#service",
    "https://www.zerosourcing.kr/service/app#service",
    "https://www.zerosourcing.kr/service/company-homepage#service",
  ],
);
```

- [ ] **Step 2: Run the Node tests and verify they fail**

Run:

```bash
pnpm --filter web exec node --test app/page-structured-data.test.mjs app/organization-json-ld.test.mjs
```

Expected: FAIL because the service pages do not render JSON-LD and the offer items have no `@id`.

- [ ] **Step 3: Connect the Organization offer catalog to stable service IDs**

Add these exact `@id` values to the first three `itemOffered` objects in `apps/web/app/organization-json-ld.json`:

```json
{
  "@type": "Service",
  "@id": "https://www.zerosourcing.kr/service/mvp#service",
  "name": "MVP 개발"
}
```

```json
{
  "@type": "Service",
  "@id": "https://www.zerosourcing.kr/service/app#service",
  "name": "하이브리드 앱 개발"
}
```

```json
{
  "@type": "Service",
  "@id": "https://www.zerosourcing.kr/service/company-homepage#service",
  "name": "기업 홈페이지 제작"
}
```

Keep each object’s existing `description`, `serviceType`, and `url` unchanged. Add this documentation row under the service catalog table in `organization-json-ld.md`:

```markdown
| `hasOfferCatalog.itemListElement[].itemOffered.@id` | 전용 페이지가 있는 서비스를 페이지별 `Service` 노드와 연결하는 안정적인 엔터티 ID다. URL 뒤에 `#service`를 붙인다. |
```

- [ ] **Step 4: Add the MVP Service node**

Add imports to `apps/web/app/service/mvp/page.tsx`:

```tsx
import { JsonLd } from "../../../components/JsonLd";
import { createServiceJsonLd } from "../../../lib/seo/structured-data";
```

Replace the inline metadata input with a reusable constant while preserving the exact copy:

```tsx
const servicePageMetadata = {
  title: "제로소싱 | MVP 개발 외주, 평균 4주 출시",
  description:
    "제로소싱의 MVP 개발 외주는 검증되는 MVP를 평균 4주 만에 제작합니다. 예비창업패키지 등 정부지원금 집행이 가능하고, 기능별 정찰가로 견적이 투명합니다. MVP 개발 비용·기간·진행 방식을 안내합니다.",
  path: "/service/mvp",
} as const;

export const metadata = createPageMetadata({ ...servicePageMetadata });

const serviceJsonLd = createServiceJsonLd({
  description: servicePageMetadata.description,
  name: "MVP 개발",
  path: servicePageMetadata.path,
  serviceType: "MVP 개발",
});
```

Render the inert script as the first child of the existing `<main>`:

```tsx
<JsonLd data={serviceJsonLd} id="mvp-service-json-ld" />
```

- [ ] **Step 5: Add the hybrid-app Service node**

Add the same two imports to `apps/web/app/service/app/page.tsx`, then use:

```tsx
const servicePageMetadata = {
  title: "제로소싱 | 하이브리드 앱 개발 (iOS·안드로이드)",
  description:
    "제로소싱의 하이브리드 앱 개발은 한 번 개발해 iOS·안드로이드에 동시 출시합니다. 푸시·결제 등 네이티브 기능 연동과 구글·애플 스토어 등록 대행 포함. 앱 개발 비용·기간을 안내합니다.",
  path: "/service/app",
} as const;

export const metadata = createPageMetadata({ ...servicePageMetadata });

const serviceJsonLd = createServiceJsonLd({
  description: servicePageMetadata.description,
  name: "하이브리드 앱 개발",
  path: servicePageMetadata.path,
  serviceType: "앱 개발",
});
```

Render:

```tsx
<JsonLd data={serviceJsonLd} id="app-service-json-ld" />
```

- [ ] **Step 6: Add the company-homepage Service node**

Add the same two imports to `apps/web/app/service/company-homepage/page.tsx`, then use:

```tsx
const servicePageMetadata = {
  title: "제로소싱 | 기업 홈페이지 제작 (반응형·SEO)",
  description:
    "제로소싱의 기업 홈페이지 제작은 반응형과 네이버·구글·AI 검색 노출(SEO·GEO), 도메인·서버·보안까지 한 번에 제공합니다. 홈페이지 제작 비용·과정과 업종별 제작 사례를 확인하세요.",
  path: "/service/company-homepage",
} as const;

export const metadata = createPageMetadata({ ...servicePageMetadata });

const serviceJsonLd = createServiceJsonLd({
  description: servicePageMetadata.description,
  name: "기업 홈페이지 제작",
  path: servicePageMetadata.path,
  serviceType: "기업 홈페이지 제작",
});
```

Render:

```tsx
<JsonLd data={serviceJsonLd} id="company-homepage-service-json-ld" />
```

- [ ] **Step 7: Run service and metadata regression tests**

Run:

```bash
pnpm --filter web exec node --test app/page-structured-data.test.mjs app/organization-json-ld.test.mjs app/site-metadata.test.mjs app/service/mvp/page.test.mjs app/service/app/page.test.mjs app/service/company-homepage/page.test.mjs
```

Expected: PASS. Existing title, description, route ownership, and Organization facts remain unchanged.

- [ ] **Step 8: Commit the service schemas**

```bash
git add apps/web/app/page-structured-data.test.mjs apps/web/app/organization-json-ld.json apps/web/app/organization-json-ld.test.mjs apps/web/app/organization-json-ld.md apps/web/app/service/mvp/page.tsx apps/web/app/service/app/page.tsx apps/web/app/service/company-homepage/page.tsx
git commit -m "feat(web): add Service structured data"
```

---

### Task 4: Render BlogPosting and detail-page breadcrumbs

**Files:**

- Modify: `apps/web/app/page-structured-data.test.mjs`
- Modify: `apps/web/app/blog/[slug]/page.tsx:88`
- Modify: `apps/web/app/portfolio/[slug]/page.tsx:35`

**Interfaces:**

- Consumes: `BlogDetail.publishedDate`, existing post/portfolio canonical fields, `createBlogPostingJsonLd`, `createBreadcrumbJsonLd`, and `JsonLd`.
- Produces: a BlogPosting node plus blog breadcrumb node for published posts, and a portfolio breadcrumb node for published portfolio records.

- [ ] **Step 1: Extend the route wiring test for dynamic details**

Append these tests to `apps/web/app/page-structured-data.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the wiring test and verify the new cases fail**

Run:

```bash
pnpm --filter web exec node --test app/page-structured-data.test.mjs
```

Expected: the service case passes, while both dynamic-detail cases FAIL because the builders are not wired.

- [ ] **Step 3: Add BlogPosting and BreadcrumbList to the blog detail route**

Add imports to `apps/web/app/blog/[slug]/page.tsx`:

```tsx
import { JsonLd } from "../../../components/JsonLd";
import {
  createBlogPostingJsonLd,
  createBreadcrumbJsonLd,
} from "../../../lib/seo/structured-data";
```

Immediately after the existing `if (!post) { notFound(); }` guard, build both nodes from the resolved public record:

```tsx
const blogPostingJsonLd = createBlogPostingJsonLd({
  category: post.category,
  description: post.seoDescription || post.summary,
  imageUrl: post.thumbnailUrl,
  publishedDate: post.publishedDate,
  slug: post.slug,
  title: post.title,
  updatedAt: post.updatedAt,
});
const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Index", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: post.title, path: `/blog/${post.slug}` },
]);
```

Keep `getRelatedBlogPosts` after these declarations. Render both scripts as the first children of the existing `<main>`:

```tsx
<JsonLd data={blogPostingJsonLd} id="blog-posting-json-ld" />
<JsonLd data={breadcrumbJsonLd} id="blog-breadcrumb-json-ld" />
```

Do not add a generic image when `post.thumbnailUrl` is null; the builder intentionally omits `image` in that case.

- [ ] **Step 4: Add BreadcrumbList to the portfolio detail route**

Add imports to `apps/web/app/portfolio/[slug]/page.tsx`:

```tsx
import { JsonLd } from "../../../components/JsonLd";
import { createBreadcrumbJsonLd } from "../../../lib/seo/structured-data";
```

Immediately after the existing `if (!portfolio) { notFound(); }` guard, build the node:

```tsx
const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Index", path: "/" },
  { name: "Portfolio", path: "/portfolio" },
  {
    name: portfolio.title,
    path: `/portfolio/${portfolio.slug}`,
  },
]);
```

Render it as the first child of the existing `<main>`:

```tsx
<JsonLd data={breadcrumbJsonLd} id="portfolio-breadcrumb-json-ld" />
```

- [ ] **Step 5: Run focused and full web verification**

Run:

```bash
pnpm --filter web exec node --test app/page-structured-data.test.mjs app/site-metadata.test.mjs
pnpm --filter web exec vitest run lib/seo/structured-data.test.ts lib/public-content/public-content.test.ts
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```

Expected: every command exits 0. The build must not report client-component serialization errors, duplicate metadata, or dynamic-route failures.

- [ ] **Step 6: Commit the detail schemas**

```bash
git add apps/web/app/page-structured-data.test.mjs apps/web/app/blog/'[slug]'/page.tsx apps/web/app/portfolio/'[slug]'/page.tsx
git commit -m "feat(web): add detail page structured data"
```

---

## Final rendered-output verification

After the production build is running on port `3100`, verify that each script is present and parseable. Start the built app in terminal A:

```bash
pnpm --filter web exec next start --port 3100
```

Run this probe in terminal B:

```bash
node --input-type=module <<'NODE'
const expectations = [
  ["/service/mvp", ["mvp-service-json-ld"]],
  ["/service/app", ["app-service-json-ld"]],
  [
    "/service/company-homepage",
    ["company-homepage-service-json-ld"],
  ],
  [
    "/blog/mvp-development-checklist",
    ["blog-posting-json-ld", "blog-breadcrumb-json-ld"],
  ],
  [
    "/portfolio/lipang-overseas-counterfeit-monitoring-dashboard",
    ["portfolio-breadcrumb-json-ld"],
  ],
];

for (const [path, ids] of expectations) {
  const response = await fetch(`http://127.0.0.1:3100${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const html = await response.text();

  for (const id of ids) {
    const pattern = new RegExp(
      `<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`,
    );
    const match = pattern.exec(html);
    if (!match) throw new Error(`${path}: missing ${id}`);
    const data = JSON.parse(match[1]);
    console.log(path, id, data["@type"]);
  }
}
NODE
```

Expected output:

```text
/service/mvp mvp-service-json-ld Service
/service/app app-service-json-ld Service
/service/company-homepage company-homepage-service-json-ld Service
/blog/mvp-development-checklist blog-posting-json-ld BlogPosting
/blog/mvp-development-checklist blog-breadcrumb-json-ld BreadcrumbList
/portfolio/lipang-overseas-counterfeit-monitoring-dashboard portfolio-breadcrumb-json-ld BreadcrumbList
```

After deployment:

- Validate `https://www.zerosourcing.kr/blog/mvp-development-checklist` in Google Rich Results Test. Expected: `BlogPosting` and `BreadcrumbList` detected with no critical errors. A missing `image` on a record without a thumbnail may appear as a recommendation, not fabricated data to patch around.
- Validate one published portfolio detail in Google Rich Results Test. Expected: `BreadcrumbList` detected with no critical errors.
- Validate all three service URLs in <https://validator.schema.org/>. Expected: one `Service` per page, each linked to `https://www.zerosourcing.kr/#organization`, with no schema errors.
- Re-run mobile Lighthouse SEO on the home, one service route, one blog detail, and one portfolio detail. Expected: all remain `100`; the new work improves entity detail beyond Lighthouse’s scored checks rather than increasing the already-maxed score.

## Acceptance criteria

- The root page still emits exactly one valid `Organization` script.
- Each of the three service routes emits exactly one route-specific `Service` script with stable `@id`, canonical `url`, real page copy, provider, service type, and area served.
- The first three Organization offer catalog entries use the same three service `@id` values.
- Each published blog detail emits `BlogPosting` with headline, real description, raw publication date, modification timestamp, Organization author/publisher, canonical URL, category, Korean language, and a thumbnail image only when present.
- Each published blog and portfolio detail emits a three-level `BreadcrumbList` matching its existing `Index / Blog|Portfolio / title` hierarchy.
- Missing/unpublished dynamic records reach `notFound()` before schema construction.
- JSON-LD serialization converts every literal `<` to `\\u003c`.
- No visible content, CSS, or interaction behavior changes; only inert JSON-LD script elements are added.
- Focused tests, full web tests, lint, type checking, and production build all pass.
- Post-deploy Article/Breadcrumb rich-result validation and Service Schema.org validation report no critical errors.
