# Admin-Managed Detail HTML Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민에서 저장·게시한 `content_mode`과 `content`가 공개 포트폴리오·블로그 상세에서 동일한 렌더러를 거쳐 표시되게 하고, 전달받은 믿잇+ HTML을 그 실제 경로로 디자인 QA한다.

**Architecture:** 공개 상세 Server Component가 Supabase REST API에서 `published`이면서 삭제되지 않은 레코드만 읽는다. 데이터베이스 연결이 설정된 환경에서는 Supabase가 유일한 상세 원본이고, 설정되지 않은 기존 개발·빌드 환경에서만 로컬 fixture를 사용한다. HTML 모드는 공통 sandboxed `srcDoc` iframe으로 격리하고, text 모드는 escaped text로 렌더링해 포트폴리오와 블로그가 완전히 같은 콘텐츠 렌더링 계약을 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19 Server/Client Components, native `fetch`, Supabase PostgREST/RLS, TypeScript, CSS Modules, Node.js `node:test`

## Global Constraints

- UI 변경 전 확인한 `design.md`의 typography, color token, spacing 규칙을 따른다.
- 이전 계획의 정적 `/public/design-qa/*.html` 고정 삽입은 사용하지 않는다. QA HTML도 반드시 어드민 textarea → Supabase `content` → 공개 상세 조회 → 공통 렌더러 경로를 통과한다.
- `content_mode = 'html'`은 HTML fragment와 완전한 `<!DOCTYPE html>` 문서를 모두 지원한다.
- `content_mode = 'text'`는 HTML로 해석하지 않고 그대로 escaped text로 표시한다.
- HTML의 전역 `body`, `main`, `.section` CSS와 script가 공개 앱 shell을 변경하지 못하도록 iframe을 사용한다.
- iframe은 `sandbox="allow-scripts"`만 허용한다. `allow-same-origin`, forms, popups, top-navigation 권한은 허용하지 않는다.
- 공개 RLS는 `status = 'published' and deleted_at is null`인 행만 `anon`/`authenticated`가 조회할 수 있게 한다. draft와 soft-deleted 행은 공개하지 않는다.
- Supabase 환경변수가 모두 있으면 Supabase가 authoritative source다. 게시 행이 없을 때 로컬 fixture로 되돌아가지 않고 `notFound()` 처리한다.
- Supabase 환경변수가 모두 없을 때만 현재 로컬 상세 데이터를 유지한다. 둘 중 하나만 있거나 URL이 잘못되면 설정 오류로 실패한다.
- 공개 웹은 publishable key만 사용하고 `service_role`/secret key를 사용하지 않는다.
- 상세 조회는 Server Component에서 직접 수행한다. 내부 GET Route Handler를 추가하지 않는다.
- metadata와 page가 같은 레코드를 중복 조회하지 않도록 React `cache()`로 request memoization한다.
- 이번 범위는 `/portfolio/[slug]`와 `/blog/[slug]` 상세의 실제 등록 결과 검증이다. 목록과 sitemap의 Supabase 전환은 별도 작업으로 남긴다.
- 현재 제공된 HTML은 `images/meetit-feature-01.png`부터 `06.png`까지 경로만 포함하고 실제 이미지 파일은 포함하지 않는다. 따라서 실제 어드민 경로에서도 해당 영역은 회색 프레임으로 보이는 것이 현재 입력값과 동일한 결과다.
- 현재 작업 트리의 `docs/reviews/` 등 사용자 변경은 수정하거나 되돌리지 않는다.

---

## File Map

- Create: `supabase/migrations/20260714000000_public_published_content_read.sql` — 게시된 상세 콘텐츠의 공개 SELECT 정책
- Create: `apps/web/.env.example` — 공개 웹의 서버측 Supabase 설정 계약
- Create: `apps/web/lib/public-content.ts` — publishable key를 사용한 no-store PostgREST 조회
- Create: `apps/web/app/portfolio/portfolio-detail-data.ts` — 어드민 Portfolio row와 기존 fixture를 상세 view model로 매핑
- Create: `apps/web/app/blog/blog-detail-data.ts` — 어드민 Blog row와 기존 fixture를 상세 view model로 매핑
- Create: `apps/web/components/ManagedContent.tsx` — HTML/text 공통 콘텐츠 렌더러
- Create: `apps/web/components/ManagedContent.module.css` — iframe과 plain text host 스타일
- Create: `apps/web/app/admin-managed-detail.test.mjs` — RLS, 조회, 렌더러, route 연결 회귀 테스트
- Modify: `apps/web/app/portfolio/[slug]/page.tsx`
- Modify: `apps/web/app/portfolio/[slug]/portfolio-detail.module.css`
- Modify: `apps/web/app/blog/[slug]/page.tsx`
- Modify: `apps/web/app/blog/[slug]/blog-detail.module.css`
- Verify unchanged: `apps/web/app/detail-html-height.test.mjs`
- Verify unchanged: `apps/web/app/detail-title-640.test.mjs`

### Task 1: Add a published-only public read contract

**Files:**
- Create: `supabase/migrations/20260714000000_public_published_content_read.sql`
- Create: `apps/web/.env.example`
- Create: `apps/web/app/admin-managed-detail.test.mjs`

**Interfaces:**
- Produces: anonymous SELECT access limited to published, non-deleted Portfolio and Blog rows
- Produces: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` configuration contract for `apps/web`

- [ ] **Step 1: Write the failing migration and environment contract test**

Create `apps/web/app/admin-managed-detail.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL(
  "../../../supabase/migrations/20260714000000_public_published_content_read.sql",
  import.meta.url,
);
const envExamplePath = new URL("../.env.example", import.meta.url);

test("public content policies expose only published active rows", async () => {
  const [migration, envExample] = await Promise.all([
    readFile(migrationPath, "utf8"),
    readFile(envExamplePath, "utf8"),
  ]);

  for (const table of ["portfolios", "blog_posts"]) {
    assert.match(
      migration,
      new RegExp(
        `grant select on table public\\.${table} to anon, authenticated;`,
      ),
    );
    assert.match(
      migration,
      new RegExp(
        `on public\\.${table}[\\s\\S]*?for select[\\s\\S]*?to anon, authenticated[\\s\\S]*?status = 'published'[\\s\\S]*?deleted_at is null`,
      ),
    );
  }

  assert.doesNotMatch(migration, /grant\s+(?:insert|update|delete).*anon/i);
  assert.match(envExample, /^SUPABASE_URL=$/m);
  assert.match(envExample, /^SUPABASE_PUBLISHABLE_KEY=$/m);
  assert.doesNotMatch(envExample, /SERVICE_ROLE|SECRET_KEY/);
});
```

- [ ] **Step 2: Run the test and verify it fails with missing files**

```bash
node --test apps/web/app/admin-managed-detail.test.mjs
```

Expected: FAIL with `ENOENT` for the new migration or `apps/web/.env.example`.

- [ ] **Step 3: Add the exact RLS migration**

Create `supabase/migrations/20260714000000_public_published_content_read.sql`:

```sql
grant select on table public.portfolios to anon, authenticated;
grant select on table public.blog_posts to anon, authenticated;

drop policy if exists "published portfolios are publicly readable"
  on public.portfolios;
create policy "published portfolios are publicly readable"
  on public.portfolios
  for select
  to anon, authenticated
  using (
    status = 'published'
    and deleted_at is null
  );

drop policy if exists "published blog posts are publicly readable"
  on public.blog_posts;
create policy "published blog posts are publicly readable"
  on public.blog_posts
  for select
  to anon, authenticated
  using (
    status = 'published'
    and deleted_at is null
  );
```

The existing authenticated-admin SELECT policies remain in place. PostgreSQL combines permissive SELECT policies, so admins still read drafts while non-admin requests only read published rows.

- [ ] **Step 4: Add the web environment template**

Create `apps/web/.env.example`:

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

Do not copy `apps/admin/.env.local` into source control and do not introduce a Supabase secret/service key.

- [ ] **Step 5: Re-run the contract test**

```bash
node --test apps/web/app/admin-managed-detail.test.mjs
```

Expected: 1 test passes, 0 tests fail.

- [ ] **Step 6: Commit the database contract**

```bash
git add supabase/migrations/20260714000000_public_published_content_read.sql apps/web/.env.example apps/web/app/admin-managed-detail.test.mjs
git commit -m "feat(content): expose published detail records"
```

### Task 2: Read the same records written by Admin

**Files:**
- Create: `apps/web/lib/public-content.ts`
- Create: `apps/web/app/portfolio/portfolio-detail-data.ts`
- Create: `apps/web/app/blog/blog-detail-data.ts`
- Modify: `apps/web/app/admin-managed-detail.test.mjs`

**Interfaces:**
- Produces: `fetchPublishedRecord<TRow>(table, slug, select): Promise<TRow | null>`
- Produces: `getPortfolioDetail(slug): Promise<PortfolioDetail | null>`
- Produces: `getBlogDetail(slug): Promise<BlogDetail | null>`

- [ ] **Step 1: Add a failing source-contract test for public reads**

Add these URLs near the top of `apps/web/app/admin-managed-detail.test.mjs`:

```js
const publicContentPath = new URL("../lib/public-content.ts", import.meta.url);
const portfolioDataPath = new URL(
  "./portfolio/portfolio-detail-data.ts",
  import.meta.url,
);
const blogDataPath = new URL(
  "./blog/blog-detail-data.ts",
  import.meta.url,
);
```

Append:

```js
test("detail data reads the authoritative published Admin record", async () => {
  const [publicContent, portfolioData, blogData] = await Promise.all([
    readFile(publicContentPath, "utf8"),
    readFile(portfolioDataPath, "utf8"),
    readFile(blogDataPath, "utf8"),
  ]);

  assert.match(publicContent, /import "server-only";/);
  assert.match(publicContent, /process\.env\.SUPABASE_PUBLISHABLE_KEY/);
  assert.match(publicContent, /headers:\s*\{\s*apikey:/);
  assert.doesNotMatch(publicContent, /Authorization|SERVICE_ROLE|SECRET_KEY/);
  assert.match(publicContent, /status:\s*"eq\.published"/);
  assert.match(publicContent, /deleted_at:\s*"is\.null"/);
  assert.match(publicContent, /cache:\s*"no-store"/);

  for (const source of [portfolioData, blogData]) {
    assert.match(source, /cache\(async \(slug: string\)/);
    assert.match(source, /if \(!isPublicContentConfigured\(\)\)/);
    assert.match(source, /fetchPublishedRecord/);
    assert.match(source, /return row \? map[A-Za-z]+Row\(row\) : null;/);
  }
});
```

- [ ] **Step 2: Run the tests and confirm the three data modules are missing**

```bash
node --test apps/web/app/admin-managed-detail.test.mjs
```

Expected: the RLS test passes; the data-source test fails with `ENOENT`.

- [ ] **Step 3: Implement the server-only PostgREST reader**

Create `apps/web/lib/public-content.ts`:

```ts
import "server-only";

type PublicContentConfig = {
  publishableKey: string;
  url: string;
};

type PublicContentTable = "blog_posts" | "portfolios";

function readPublicContentConfig(): PublicContentConfig | null {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  if (!url && !publishableKey) {
    return null;
  }

  if (!url || !publishableKey || !URL.canParse(url)) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must both be valid.",
    );
  }

  return { publishableKey, url };
}

export function isPublicContentConfigured(): boolean {
  return readPublicContentConfig() !== null;
}

export async function fetchPublishedRecord<TRow>(
  table: PublicContentTable,
  slug: string,
  select: string,
): Promise<TRow | null> {
  const config = readPublicContentConfig();
  if (!config) {
    throw new Error("Public content is not configured.");
  }

  const endpoint = new URL(`/rest/v1/${table}`, `${config.url}/`);
  endpoint.search = new URLSearchParams({
    deleted_at: "is.null",
    limit: "1",
    select,
    slug: `eq.${slug}`,
    status: "eq.published",
  }).toString();

  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: { apikey: config.publishableKey },
  });

  if (!response.ok) {
    throw new Error(`Public content request failed with ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Public content response must be an array.");
  }

  return (payload[0] as TRow | undefined) ?? null;
}
```

- [ ] **Step 4: Map Portfolio Admin rows to the public detail view**

Create `apps/web/app/portfolio/portfolio-detail-data.ts`:

```ts
import { cache } from "react";

import {
  fetchPublishedRecord,
  isPublicContentConfigured,
} from "../../lib/public-content";
import { portfolioDetails } from "./portfolio-items";

type ContentMode = "html" | "text";

type PortfolioPublicRow = {
  content: string;
  content_mode: ContentMode;
  core_features: readonly string[];
  development_period: string;
  estimate_label: string;
  product_description: string;
  seo_description: string;
  slug: string;
  title: string;
  work_scopes: readonly string[];
};

export type PortfolioDetail = {
  content: string;
  contentMode: ContentMode;
  description: string;
  estimate: string;
  features: readonly string[];
  period: string;
  scope: readonly string[];
  seoDescription: string;
  slug: string;
  title: string;
};

const portfolioSelect = [
  "slug",
  "title",
  "product_description",
  "estimate_label",
  "development_period",
  "core_features",
  "work_scopes",
  "content_mode",
  "content",
  "seo_description",
].join(",");

function getLocalPortfolio(slug: string): PortfolioDetail | null {
  const item = portfolioDetails.find((portfolio) => portfolio.slug === slug);
  if (!item) return null;

  return {
    ...item,
    content: "HTML",
    contentMode: "text",
    seoDescription: item.description,
  };
}

function mapPortfolioRow(row: PortfolioPublicRow): PortfolioDetail {
  return {
    content: row.content,
    contentMode: row.content_mode,
    description: row.product_description,
    estimate: row.estimate_label,
    features: row.core_features,
    period: row.development_period,
    scope: row.work_scopes,
    seoDescription: row.seo_description,
    slug: row.slug,
    title: row.title,
  };
}

export const getPortfolioDetail = cache(async (slug: string) => {
  if (!isPublicContentConfigured()) {
    return getLocalPortfolio(slug);
  }

  const row = await fetchPublishedRecord<PortfolioPublicRow>(
    "portfolios",
    slug,
    portfolioSelect,
  );
  return row ? mapPortfolioRow(row) : null;
});
```

- [ ] **Step 5: Map Blog Admin rows to the public detail view**

Create `apps/web/app/blog/blog-detail-data.ts`:

```ts
import { cache } from "react";

import {
  fetchPublishedRecord,
  isPublicContentConfigured,
} from "../../lib/public-content";
import { blogPosts, type BlogPost } from "./blog-posts";

type ContentMode = "html" | "text";
type BlogType = "application" | "company_homepage" | "insight" | "mvp";

type BlogPublicRow = {
  content: string;
  content_mode: ContentMode;
  published_date: string | null;
  seo_description: string;
  slug: string;
  title: string;
  type: BlogType;
  updated_at: string;
};

export type BlogDetail = Omit<BlogPost, "contentHtml"> & {
  content: string;
  contentMode: ContentMode;
  seoDescription: string;
};

const categoryByType: Record<BlogType, string> = {
  application: "어플리케이션",
  company_homepage: "기업 홈페이지",
  insight: "인사이트",
  mvp: "MVP",
};

const blogSelect = [
  "slug",
  "title",
  "type",
  "published_date",
  "content_mode",
  "content",
  "seo_description",
  "updated_at",
].join(",");

function formatDate(publishedDate: string | null, updatedAt: string): string {
  const [year, month, day] = (publishedDate ?? updatedAt.slice(0, 10)).split("-");
  return `${year}. ${month}. ${day}`;
}

function getLocalBlog(slug: string): BlogDetail | null {
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) return null;

  const { contentHtml, ...detail } = post;
  return {
    ...detail,
    content: contentHtml,
    contentMode: "html",
    seoDescription: post.description,
  };
}

function mapBlogRow(row: BlogPublicRow): BlogDetail {
  return {
    author: "제로소싱",
    category: categoryByType[row.type],
    content: row.content,
    contentMode: row.content_mode,
    date: formatDate(row.published_date, row.updated_at),
    description: row.seo_description || row.title,
    relatedSlugs: [],
    seoDescription: row.seo_description,
    slug: row.slug,
    title: row.title,
  };
}

export const getBlogDetail = cache(async (slug: string) => {
  if (!isPublicContentConfigured()) {
    return getLocalBlog(slug);
  }

  const row = await fetchPublishedRecord<BlogPublicRow>(
    "blog_posts",
    slug,
    blogSelect,
  );
  return row ? mapBlogRow(row) : null;
});
```

The Blog admin schema has no separate public summary or related-post fields. Use `seo_description` for the visible detail description and render no related section for a managed record until those fields exist.

- [ ] **Step 6: Run focused tests and type checking**

```bash
node --test apps/web/app/admin-managed-detail.test.mjs
pnpm --filter web check-types
```

Expected: 2 tests pass and type checking exits with code 0.

- [ ] **Step 7: Commit the public content reader**

```bash
git add apps/web/lib/public-content.ts apps/web/app/portfolio/portfolio-detail-data.ts apps/web/app/blog/blog-detail-data.ts apps/web/app/admin-managed-detail.test.mjs
git commit -m "feat(web): read published admin content"
```

### Task 3: Render Admin HTML and text through one isolated component

**Files:**
- Create: `apps/web/components/ManagedContent.tsx`
- Create: `apps/web/components/ManagedContent.module.css`
- Modify: `apps/web/app/admin-managed-detail.test.mjs`

**Interfaces:**
- Consumes: `{ content: string; mode: "html" | "text"; title: string }`
- Produces: auto-height sandboxed HTML iframe or escaped text output

- [ ] **Step 1: Add the failing renderer contract test**

Add:

```js
const managedContentPath = new URL(
  "../components/ManagedContent.tsx",
  import.meta.url,
);
const managedContentStylesPath = new URL(
  "../components/ManagedContent.module.css",
  import.meta.url,
);
```

Append:

```js
test("managed HTML is isolated while text remains escaped", async () => {
  const [component, styles] = await Promise.all([
    readFile(managedContentPath, "utf8"),
    readFile(managedContentStylesPath, "utf8"),
  ]);

  assert.match(component, /^"use client";/);
  assert.match(component, /mode === "text"/);
  assert.match(component, /\{content\}/);
  assert.match(component, /srcDoc=\{sourceDocument\}/);
  assert.match(component, /sandbox="allow-scripts"/);
  assert.doesNotMatch(component, /allow-same-origin|dangerouslySetInnerHTML/);
  assert.match(component, /event\.source !== frameWindow/);
  assert.match(component, /new ResizeObserver\(sendHeight\)/);
  assert.match(styles, /background:\s*var\(--color-gray-50\);/);
  assert.match(styles, /white-space:\s*pre-wrap;/);
});
```

- [ ] **Step 2: Run the test and confirm the renderer is missing**

```bash
node --test apps/web/app/admin-managed-detail.test.mjs
```

Expected: the first 2 tests pass and the renderer test fails with `ENOENT`.

- [ ] **Step 3: Implement the common content renderer**

Create `apps/web/components/ManagedContent.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./ManagedContent.module.css";

const HEIGHT_MESSAGE_TYPE = "zerosourcing:managed-content-height";
const MIN_FRAME_HEIGHT = 1200;
const MAX_FRAME_HEIGHT = 200_000;

const RESIZE_BRIDGE = `<script>
(() => {
  const type = "zerosourcing:managed-content-height";
  const sendHeight = () => {
    const root = document.documentElement;
    const body = document.body;
    const height = Math.max(
      root.scrollHeight,
      root.offsetHeight,
      body?.scrollHeight ?? 0,
      body?.offsetHeight ?? 0
    );
    window.parent.postMessage({ type, height }, "*");
  };
  const observer = new ResizeObserver(sendHeight);
  observer.observe(document.documentElement);
  if (document.body) observer.observe(document.body);
  window.addEventListener("load", sendHeight);
  window.addEventListener("resize", sendHeight);
  sendHeight();
})();
</script>`;

type ContentMode = "html" | "text";

type ManagedContentProps = {
  content: string;
  mode: ContentMode;
  title: string;
};

type HeightMessage = {
  height: number;
  type: typeof HEIGHT_MESSAGE_TYPE;
};

function isHeightMessage(value: unknown): value is HeightMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Partial<HeightMessage>;
  if (
    message.type !== HEIGHT_MESSAGE_TYPE ||
    typeof message.height !== "number"
  ) {
    return false;
  }
  return Number.isFinite(message.height) && message.height > 0;
}

function appendResizeBridge(html: string): string {
  const closingBodyIndex = html.toLowerCase().lastIndexOf("</body>");
  if (closingBodyIndex < 0) return `${html}${RESIZE_BRIDGE}`;

  return `${html.slice(0, closingBodyIndex)}${RESIZE_BRIDGE}${html.slice(
    closingBodyIndex,
  )}`;
}

function ManagedHtmlContent({ content, title }: Omit<ManagedContentProps, "mode">) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(MIN_FRAME_HEIGHT);
  const sourceDocument = useMemo(() => appendResizeBridge(content), [content]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      const frameWindow = frameRef.current?.contentWindow;
      if (
        !frameWindow ||
        event.source !== frameWindow ||
        !isHeightMessage(event.data)
      ) {
        return;
      }

      setFrameHeight(
        Math.min(
          MAX_FRAME_HEIGHT,
          Math.max(MIN_FRAME_HEIGHT, Math.ceil(event.data.height)),
        ),
      );
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      className={styles.frame}
      loading="eager"
      ref={frameRef}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts"
      srcDoc={sourceDocument}
      style={{ height: frameHeight }}
      title={title}
    />
  );
}

export function ManagedContent({ content, mode, title }: ManagedContentProps) {
  if (mode === "text") {
    return <p className={styles.text}>{content}</p>;
  }

  return <ManagedHtmlContent content={content} title={title} />;
}
```

- [ ] **Step 4: Add host styles using the existing design tokens**

Create `apps/web/components/ManagedContent.module.css`:

```css
.frame {
  width: 100%;
  border: 0;
  background: var(--color-gray-50);
  display: block;
}

.text {
  composes: pretendard-medium-14 from global;
  width: 100%;
  margin: 0;
  color: var(--color-gray-800);
  white-space: pre-wrap;
}
```

- [ ] **Step 5: Run tests, type checking, and lint**

```bash
node --test apps/web/app/admin-managed-detail.test.mjs
pnpm --filter web check-types
pnpm --filter web lint
```

Expected: 3 tests pass; type checking and lint exit with code 0.

- [ ] **Step 6: Commit the common renderer**

```bash
git add apps/web/components/ManagedContent.tsx apps/web/components/ManagedContent.module.css apps/web/app/admin-managed-detail.test.mjs
git commit -m "feat(web): render managed detail content"
```

### Task 4: Use the managed record and renderer in both detail routes

**Files:**
- Modify: `apps/web/app/portfolio/[slug]/page.tsx`
- Modify: `apps/web/app/portfolio/[slug]/portfolio-detail.module.css`
- Modify: `apps/web/app/blog/[slug]/page.tsx`
- Modify: `apps/web/app/blog/[slug]/blog-detail.module.css`
- Modify: `apps/web/app/admin-managed-detail.test.mjs`

**Interfaces:**
- Consumes: `getPortfolioDetail`, `getBlogDetail`, and `ManagedContent`
- Produces: direct detail URLs that reflect the current published Admin row on every refresh

- [ ] **Step 1: Add a failing route integration test**

Add route/style URLs and a bounded CSS rule helper:

```js
const portfolioPagePath = new URL(
  "./portfolio/[slug]/page.tsx",
  import.meta.url,
);
const portfolioStylesPath = new URL(
  "./portfolio/[slug]/portfolio-detail.module.css",
  import.meta.url,
);
const blogPagePath = new URL("./blog/[slug]/page.tsx", import.meta.url);
const blogStylesPath = new URL(
  "./blog/[slug]/blog-detail.module.css",
  import.meta.url,
);

function rule(styles, selector) {
  const match = styles.match(new RegExp(`\\.${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `${selector} rule must exist`);
  return match[1];
}
```

Append:

```js
test("portfolio and blog routes render the published Admin content", async () => {
  const [portfolioPage, portfolioStyles, blogPage, blogStyles] =
    await Promise.all([
      readFile(portfolioPagePath, "utf8"),
      readFile(portfolioStylesPath, "utf8"),
      readFile(blogPagePath, "utf8"),
      readFile(blogStylesPath, "utf8"),
    ]);

  assert.match(portfolioPage, /await getPortfolioDetail\(slug\)/);
  assert.match(blogPage, /await getBlogDetail\(slug\)/);

  for (const page of [portfolioPage, blogPage]) {
    assert.match(page, /import \{ ManagedContent \}/);
    assert.match(page, /<ManagedContent/);
  }

  assert.doesNotMatch(blogPage, /dangerouslySetInnerHTML/);
  assert.match(blogPage, /relatedPosts\.length > 0/);
  assert.match(rule(portfolioStyles, "htmlPreview"), /overflow:\s*hidden;/);
  assert.match(rule(blogStyles, "articleBody"), /overflow:\s*hidden;/);
});
```

- [ ] **Step 2: Run the integration test and verify it fails**

```bash
node --test apps/web/app/admin-managed-detail.test.mjs
```

Expected: the first 3 tests pass and the route integration test fails.

- [ ] **Step 3: Connect Portfolio metadata and page rendering**

In `apps/web/app/portfolio/[slug]/page.tsx`:

```tsx
import { ManagedContent } from "../../../components/ManagedContent";
import { getPortfolioDetail } from "../portfolio-detail-data";
```

Keep `portfolioDetails` only for `generateStaticParams()`. In both `generateMetadata` and `PortfolioDetailPage`, replace the local `.find()` with:

```tsx
const portfolio = await getPortfolioDetail(slug);
```

Keep the existing null branches: `generateMetadata` returns `{}` when `portfolio` is null, while `PortfolioDetailPage` calls `notFound()` before reading any fields.

Build metadata with the Admin SEO value first:

```tsx
return createPageMetadata({
  title: portfolio.title,
  description: portfolio.seoDescription || portfolio.description,
  path: `/portfolio/${portfolio.slug}`,
});
```

Replace the `HTML` marker with:

```tsx
<div className={styles.htmlPreview}>
  <ManagedContent
    content={portfolio.content}
    mode={portfolio.contentMode}
    title={`${portfolio.title} 본문`}
  />
</div>
```

- [ ] **Step 4: Make the Portfolio content slot an iframe/text host**

Replace `.htmlPreview` in `portfolio-detail.module.css` with:

```css
.htmlPreview {
  width: 100%;
  min-height: 1200px;
  overflow: hidden;
  background: var(--color-gray-50);
}
```

Keep the existing 480px `min-height: 720px` rule.

- [ ] **Step 5: Connect Blog metadata and page rendering**

In `apps/web/app/blog/[slug]/page.tsx` add:

```tsx
import { ManagedContent } from "../../../components/ManagedContent";
import { getBlogDetail } from "../blog-detail-data";
```

Change `Meta` to accept the common structural subset:

```tsx
type PostMeta = Pick<BlogPost, "author" | "date">;

function Meta({ post }: { post: PostMeta }) {
```

In `generateMetadata` and `BlogDetailPage`, replace the local `.find()` with:

```tsx
const post = await getBlogDetail(slug);
```

Keep the existing null branches: `generateMetadata` returns `{}` when `post` is null, while `BlogDetailPage` calls `notFound()` before reading any fields.

Use:

```tsx
return createPageMetadata({
  title: post.title,
  description: post.seoDescription || post.description,
  path: `/blog/${post.slug}`,
});
```

Replace `dangerouslySetInnerHTML` with:

```tsx
<div className={styles.articleBody}>
  <ManagedContent
    content={post.content}
    mode={post.contentMode}
    title={`${post.title} 본문`}
  />
</div>
```

Since Admin has no related-post field, wrap the related section:

```tsx
{relatedPosts.length > 0 ? (
  <section className={styles.relatedSection}>
    <h2 className={styles.relatedHeading}>함께 읽으면 좋은 글</h2>
    <div className={styles.relatedList}>
      {relatedPosts.map((relatedPost, index) => (
        <RelatedPostCard
          key={`${relatedPost.slug}-${index}`}
          post={relatedPost}
        />
      ))}
    </div>
  </section>
) : null}
```

- [ ] **Step 6: Make the Blog content slot an iframe/text host**

Replace `.articleBody` in `blog-detail.module.css` with:

```css
.articleBody {
  min-height: 1200px;
  overflow: hidden;
  background: var(--color-gray-50);
}
```

Delete the obsolete `.articleBody :where(p)` rule; content descendants now live in the iframe or the shared text component.

- [ ] **Step 7: Run all detail verification**

```bash
node --test apps/web/app/admin-managed-detail.test.mjs apps/web/app/detail-html-height.test.mjs apps/web/app/detail-title-640.test.mjs
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

Expected: 6 tests pass and all project checks exit with code 0. Run the build with Supabase variables unset so the existing fixture-backed routes remain buildable; the configured runtime path is verified in the end-to-end step below.

- [ ] **Step 8: Commit the route integration**

```bash
git add 'apps/web/app/portfolio/[slug]/page.tsx' 'apps/web/app/portfolio/[slug]/portfolio-detail.module.css' 'apps/web/app/blog/[slug]/page.tsx' 'apps/web/app/blog/[slug]/blog-detail.module.css' apps/web/app/admin-managed-detail.test.mjs
git commit -m "feat(web): connect admin-managed details"
```

### Task 5: Prove parity through the real Admin workflow

**Files:**
- Read: `/Users/sangkun/Desktop/zerosourcing_portfolio_meetitplus_feature_images.html`
- External state with approval: apply the new Supabase migration and create QA records through Admin
- Do not commit: `apps/web/.env.local`, screenshots under `/tmp`

**Interfaces:**
- Consumes: the deployed RLS policy and the same Supabase project used by `apps/admin`
- Produces: `/portfolio/meetit-plus-design-qa` and `/blog/meetit-plus-design-qa` rendering the exact saved Admin content

- [ ] **Step 1: Pause for authorization before changing the shared Supabase project**

Applying the migration and creating records changes external shared state. Obtain explicit user approval, then apply the exact SQL from `supabase/migrations/20260714000000_public_published_content_read.sql` in the Supabase SQL editor or the project's authenticated migration workflow.

- [ ] **Step 2: Configure the web app locally without committing credentials**

Create `apps/web/.env.local` locally. Copy the value of `VITE_SUPABASE_URL` from the ignored `apps/admin/.env.local` into `SUPABASE_URL`, and copy the value of `VITE_SUPABASE_ANON_KEY` into `SUPABASE_PUBLISHABLE_KEY`. Do not print either value in command output or add the file to source control.

Confirm `git status --short apps/web/.env.local` produces no output because `.env.local` remains ignored.

- [ ] **Step 3: Start both real applications**

```bash
pnpm --filter web dev
pnpm --filter admin dev
```

Expected: web serves on `http://127.0.0.1:3000` and Admin on `http://127.0.0.1:3002`.

- [ ] **Step 4: Verify draft records remain private**

In Admin, create both records with slug `meetit-plus-design-qa`, select `HTML 작성`, paste the full contents of the supplied HTML into `content`, and save as draft. Use these deterministic form values so the normal detail shell is also QA'd:

Portfolio:

- 유형: `MVP`
- 기업명/제목: `믿잇 플러스(CJ제일제당 사내벤처)`
- 프로덕트 설명: `시니어 활동 프로그램 홍보 및 참가자 모집 플랫폼`
- 견적: `298만 원(VAT포함)`
- 개발 기간: `3주`
- 핵심 기능: `활동 등록`, `신청·참여`, `선착순`, `알림톡`, `비회원 조회`
- 작업 범위: `기획`, `UX/UI 디자인`, `웹 개발`, `도메인·서버`
- SEO Description: `중장년 여가 커뮤니티 플랫폼 외주 개발 사례입니다. 여가활동 탐색, 선착순 참가 신청, 네이버 스마트스토어 결제 연계, 회원·비회원 예약 조회, 카카오 알림톡과 관리자 페이지를 구현했습니다.`

Blog:

- 유형: `MVP`
- 제목: `믿잇 플러스 디자인 QA`
- 작성일: `2026-07-14`
- 썸네일: 비워 둠
- SEO Description: Portfolio와 동일한 문구
- 랜딩/배너 노출: 끔

Visit:

```text
http://127.0.0.1:3000/portfolio/meetit-plus-design-qa
http://127.0.0.1:3000/blog/meetit-plus-design-qa
```

Expected: both return the app's not-found result because public RLS cannot select drafts.

- [ ] **Step 5: Publish through Admin and verify the exact stored output**

Publish both records without changing `content`. Refresh the same URLs.

Expected:

- Each route uses its normal detail hero/summary/CTA/footer shell.
- Both content slots render the exact HTML stored by Admin through `ManagedContent`.
- The supplied document's global CSS does not alter the parent Header, CTA, related content, or Footer.
- No nested vertical scrollbar or clipped iframe bottom appears.
- Portfolio renders at its existing maximum 1080px content width; Blog renders at its existing 640px article width.
- The inline IntersectionObserver script runs inside the sandbox.
- The six absent feature images remain gray frames, matching the actual submitted HTML and available assets.

- [ ] **Step 6: Verify updates and publication state are authoritative**

Change one visible sentence in each Admin record and save as published. Refresh the public detail URLs.

Expected: the changed sentence appears immediately because the server fetch uses `cache: "no-store"`.

Then change one record to draft.

Expected: that public detail becomes not found after refresh and does not fall back to the local fixture.

- [ ] **Step 7: Capture responsive evidence outside the worktree**

```bash
pnpm screenshot -- http://127.0.0.1:3000/portfolio/meetit-plus-design-qa --output /tmp/zerosourcing-admin-detail-qa/portfolio
pnpm screenshot -- http://127.0.0.1:3000/blog/meetit-plus-design-qa --output /tmp/zerosourcing-admin-detail-qa/blog
```

Inspect 1920px, 1080px, 640px, and 390px captures. Do not delete or alter the shared QA records without separate approval.

## Completion Boundary

This plan proves the exact Admin-to-detail rendering path. It intentionally does not migrate Portfolio/Blog list pages or sitemap generation to Supabase. After QA approval, that should be a separate content-source migration so list visibility, featured selection, search, related posts, and sitemap publication are designed together rather than partially inferred.
