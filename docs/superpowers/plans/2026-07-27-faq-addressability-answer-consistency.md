# FAQ Addressability and Answer Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every FAQ answer use the FAQ hub's approved copy, give every question a stable deep link and heading, and preserve the current UI pixel-for-pixel when accordions are closed.

**Architecture:** Move FAQ facts into `apps/web/content/faqs.ts` as a stable-ID registry and derive the FAQ hub, home, and service-page lists from ID projections. Keep FAQ category presentation metadata in `apps/web/app/faq/content.ts`. Add hash targeting as a small Client Component while leaving the shared FAQ renderer and page metadata on their current Server/Client boundaries.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript 5.9, CSS Modules, Vitest 4, Node test runner, existing Chrome screenshot harness.

## Global Constraints

- The current FAQ hub answer is authoritative whenever the same question appears with a different answer elsewhere.
- The canonical answer for `개발 기간은 보통 얼마나 걸리나요?` is the first FAQ-hub occurrence in `commonFaqs`; the `timelineFaqs` occurrence must reference the same record and answer.
- Keep all current visible question text, row counts, ordering, icons, open/closed behavior, CSS class names, typography, colors, spacing, breakpoints, and divider elements.
- Intentional answer-copy changes are allowed when an accordion is open. No unrelated visible copy may change.
- Closed-state screenshots of `/`, `/faq`, `/service/mvp`, `/service/app`, and `/service/company-homepage` must remain pixel-identical at 1920, 1080, 640, and 390 px widths.
- Use one stable kebab-case FAQ ID per distinct question. IDs must not be generated from question text at render time.
- Use `/faq#<faq-id>` as the canonical question permalink. Do not create 43 thin `/faq/[slug]` routes.
- Keep the existing `/faq` document title, description, Open Graph metadata, and canonical URL unchanged.
- Preserve the current `h1` page title and `h2` category headings; change each question label from `span` to `h3` without changing its computed typography or box geometry.
- Category navigation must be real `href="#<category-id>"` links and retain the current smooth-scroll, reduced-motion, active-state, and sticky behavior.
- A direct hash visit to a question must open the matching native `details` element and scroll it below the fixed header. A category hash must continue to target the category section without opening an accordion.
- Reuse the existing `Icon` component and explicit divider elements. Add no icons, dependencies, per-question pages, CMS tables, API routes, or FAQ structured data in this scope.
- CSS additions are limited to browser-default resets and nonvisual hash-offset/link-normalization rules: `margin: 0`, `text-decoration: none`, and `scroll-margin-top` on existing selectors.
- `codex/refactor-faq-single-source` must not be cherry-picked wholesale: it chooses several service-page answers as canonical, which conflicts with the user's FAQ-hub-authoritative decision.
- Preserve unrelated work in the current worktree, including `docs/superpowers/plans/2026-07-27-page-specific-structured-data.md`.
- At plan-writing time, `apps/web/components/FaqSection.module.css` has an unrelated uncommitted change removing summary and answer padding. Treat the execution-time worktree as authoritative, capture the “before” screenshots before any FAQ edit, and do not restore or overwrite that change without the user's direction.

---

## Approved answer decisions

The following seven drifted groups are resolved exactly as shown. All other FAQ-hub records move byte-for-byte from the current `apps/web/app/faq/content.ts`; the two service-only questions keep their current service answers.

| Stable ID                    | Question                                          | Exact canonical answer                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `delivery-timeline`          | 개발 기간은 보통 얼마나 걸리나요?                 | 제로소싱의 MVP 개발 기간은 평균 4주 내외입니다. 풀스펙으로 6개월씩 끄는 대신, 검증에 꼭 필요한 핵심 기능만 담아 빠르게 출시합니다. 상담에서 기능 범위를 확정한 뒤 정확한 일정을 약속드리고, 진행 중 변동이 생기면 즉시 공유합니다. |
| `dual-platform-app-delivery` | iOS와 안드로이드를 둘 다 만들어주나요?            | 네. 제로소싱은 웹뷰 하이브리드 방식으로 한 번 개발해 iOS와 안드로이드에 동시 출시합니다.                                                                                                                                           |
| `app-store-registration`     | 앱스토어·플레이스토어 등록도 해주나요?            | 네. 개발자 계정 설정 안내부터 스토어 등록 자료 준비, 심사 대응까지 함께 진행합니다.                                                                                                                                                |
| `cms-content-updates`        | 홈페이지를 만든 뒤 내용 수정은 직접 할 수 있나요? | 네. 글과 이미지를 직접 바꿀 수 있는 콘텐츠 관리 기능(CMS)을 기본 제공합니다.                                                                                                                                                       |
| `search-engine-optimization` | 네이버·구글 검색에 잘 나오게 해주나요?            | 네. 메타태그, 사이트맵, 구조화 데이터, 페이지 속도처럼 기본 SEO 세팅을 함께 적용합니다.                                                                                                                                            |
| `ai-search-discoverability`  | AI 검색(ChatGPT·Claude)에도 노출되나요?           | 회사와 서비스 정보를 구조화해 AI가 인용하기 쉬운 형태로 정리합니다.                                                                                                                                                                |
| `company-domain-hosting-ssl` | 도메인과 서버도 맡아 주나요?                      | 네. 도메인 연결, 서버 배포, SSL 보안 설정까지 함께 진행할 수 있습니다.                                                                                                                                                             |

The app service therefore removes the extra “시간과 비용이 절반” and first-launch guidance sentences. The company-homepage service removes the four extra explanatory sentences that do not appear in the FAQ hub.

## Canonical FAQ inventory

`apps/web/content/faqs.ts` must contain these IDs and questions. The source column is an exact copy rule, not an editorial prompt.

| ID                                   | Question                                                  | Authoritative source                      |
| ------------------------------------ | --------------------------------------------------------- | ----------------------------------------- |
| `mvp-development-cost`               | MVP 개발 비용은 얼마나 드나요?                            | Current FAQ `commonFaqs`                  |
| `delivery-timeline`                  | 개발 기간은 보통 얼마나 걸리나요?                         | Approved table above                      |
| `outsourcing-estimate-variation`     | 외주 개발 견적이 업체마다 천차만별인 이유는 뭔가요?       | Current FAQ `commonFaqs`                  |
| `planning-without-spec`              | 기획이 없어도 MVP 개발을 의뢰할 수 있나요?                | Current FAQ `commonFaqs`                  |
| `source-code-and-ownership`          | 소스코드와 결과물의 소유권은 모두 넘겨받나요?             | Current FAQ `commonFaqs`                  |
| `mvp-post-launch-support`            | MVP 출시 후 추가 개발과 유지보수도 가능한가요?            | Current FAQ `commonFaqs`                  |
| `nocode-vs-custom-development`       | 노코드와 외주 개발, 어떤 게 우리 MVP에 맞을까요?          | Current FAQ `commonFaqs`                  |
| `consultation-and-estimate-free`     | 상담과 견적은 무료인가요?                                 | Current FAQ `pricingFaqs`                 |
| `estimate-scope`                     | 견적은 어떤 기준으로 산정되나요?                          | Current FAQ `pricingFaqs`                 |
| `small-budget-mvp`                   | 예산이 작아도 의뢰할 수 있나요?                           | Current FAQ `pricingFaqs`                 |
| `government-funding-development`     | 정부지원금으로 개발비를 낼 수 있나요?                     | Current FAQ `pricingFaqs`                 |
| `additional-costs`                   | 추가 비용은 언제 발생하나요?                              | Current FAQ `pricingFaqs`                 |
| `delivery-progress-sharing`          | 진행 과정은 어떻게 공유되나요?                            | Current FAQ `timelineFaqs`                |
| `scope-change`                       | 중간에 기능을 바꿀 수 있나요?                             | Current FAQ `timelineFaqs`                |
| `expedited-launch`                   | 빠르게 출시해야 하는 경우도 가능한가요?                   | Current FAQ `timelineFaqs`                |
| `deployment-support`                 | 배포까지 맡아 주나요?                                     | Current FAQ `timelineFaqs`                |
| `technology-selection`               | 어떤 기술로 개발하나요?                                   | Current FAQ `techFaqs`                    |
| `common-integrations`                | 결제, 로그인, 알림 같은 기능도 가능한가요?                | Current FAQ `techFaqs`                    |
| `source-code-delivery`               | 소스코드는 받을 수 있나요?                                | Current FAQ `techFaqs`                    |
| `existing-service-enhancement`       | 기존 서비스에 기능을 추가할 수도 있나요?                  | Current FAQ `techFaqs`                    |
| `nocode-to-custom-migration`         | 노코드로 만든 서비스를 개발로 전환할 수 있나요?           | Current FAQ `techFaqs`                    |
| `post-launch-maintenance`            | 출시 후 유지보수도 가능한가요?                            | Current FAQ `afterLaunchFaqs`             |
| `post-launch-feature-prioritization` | 출시 후 기능 추가는 어떻게 진행하나요?                    | Current FAQ `afterLaunchFaqs`             |
| `incident-response`                  | 운영 중 문제가 생기면 대응해 주나요?                      | Current FAQ `afterLaunchFaqs`             |
| `admin-page-inclusion`               | 관리자 페이지도 포함되나요?                               | Current FAQ `afterLaunchFaqs`             |
| `search-and-ai-discoverability`      | 검색 노출이나 AI 검색도 고려하나요?                       | Current FAQ `afterLaunchFaqs`             |
| `mvp-feature-scope`                  | MVP에 기능은 보통 몇 개나 넣나요?                         | Current FAQ `mvpFaqs`                     |
| `mvp-expansion`                      | MVP만 만들고 끝나면, 나중에 확장은 어떻게 하나요?         | Current FAQ `mvpFaqs`                     |
| `mvp-design-quality`                 | MVP라서 디자인 완성도는 떨어지나요?                       | Current FAQ `mvpFaqs`                     |
| `mvp-investment-or-funding`          | MVP 결과물로 투자 유치나 정부지원사업에 활용할 수 있나요? | Current FAQ `mvpFaqs`                     |
| `government-funding-mvp`             | 정부지원금으로 MVP 개발비를 낼 수 있나요?                 | Current FAQ `mvpFaqs`                     |
| `hybrid-vs-native`                   | 웹뷰 하이브리드 앱은 네이티브 앱과 뭐가 다른가요?         | Current FAQ `appFaqs`                     |
| `dual-platform-app-delivery`         | iOS와 안드로이드를 둘 다 만들어주나요?                    | Approved table above                      |
| `app-store-registration`             | 앱스토어·플레이스토어 등록도 해주나요?                    | Approved table above                      |
| `app-native-features`                | 푸시 알림이나 카메라 같은 기능도 되나요?                  | Current FAQ `appFaqs`                     |
| `app-update-process`                 | 출시 후 수정과 업데이트는 어떻게 하나요?                  | Current FAQ `appFaqs`                     |
| `hybrid-app-suitability`             | 하이브리드가 안 맞는 앱도 있나요?                         | Current app-service FAQ only              |
| `company-homepage-time-and-cost`     | 기업 홈페이지 제작 기간과 비용은 어떻게 되나요?           | Current FAQ `companyHomepageFaqs`         |
| `cms-content-updates`                | 홈페이지를 만든 뒤 내용 수정은 직접 할 수 있나요?         | Approved table above                      |
| `search-engine-optimization`         | 네이버·구글 검색에 잘 나오게 해주나요?                    | Approved table above                      |
| `ai-search-discoverability`          | AI 검색(ChatGPT·Claude)에도 노출되나요?                   | Approved table above                      |
| `responsive-company-homepage`        | 모바일에서도 잘 보이나요?                                 | Current company-homepage-service FAQ only |
| `company-domain-hosting-ssl`         | 도메인과 서버도 맡아 주나요?                              | Approved table above                      |

Semantically related but differently worded questions remain separate in this change. This avoids silently changing user-visible questions or collapsing category rows.

## Required projections

The central module exports lists in this exact order:

```ts
export const commonFaqs = selectFaqs([
  "mvp-development-cost",
  "delivery-timeline",
  "outsourcing-estimate-variation",
  "planning-without-spec",
  "source-code-and-ownership",
  "mvp-post-launch-support",
  "nocode-vs-custom-development",
]);

export const pricingFaqs = selectFaqs([
  "consultation-and-estimate-free",
  "estimate-scope",
  "small-budget-mvp",
  "government-funding-development",
  "additional-costs",
]);

export const timelineFaqs = selectFaqs([
  "delivery-timeline",
  "delivery-progress-sharing",
  "scope-change",
  "expedited-launch",
  "deployment-support",
]);

export const techFaqs = selectFaqs([
  "technology-selection",
  "common-integrations",
  "source-code-delivery",
  "existing-service-enhancement",
  "nocode-to-custom-migration",
]);

export const afterLaunchFaqs = selectFaqs([
  "post-launch-maintenance",
  "post-launch-feature-prioritization",
  "incident-response",
  "admin-page-inclusion",
  "search-and-ai-discoverability",
]);

export const mvpFaqs = selectFaqs([
  "mvp-feature-scope",
  "mvp-expansion",
  "mvp-design-quality",
  "mvp-investment-or-funding",
  "government-funding-mvp",
]);

export const appFaqs = selectFaqs([
  "hybrid-vs-native",
  "dual-platform-app-delivery",
  "app-store-registration",
  "app-native-features",
  "app-update-process",
]);

export const appServiceFaqs = selectFaqs([
  "hybrid-vs-native",
  "dual-platform-app-delivery",
  "app-store-registration",
  "app-native-features",
  "app-update-process",
  "hybrid-app-suitability",
]);

export const companyHomepageFaqs = selectFaqs([
  "company-homepage-time-and-cost",
  "cms-content-updates",
  "search-engine-optimization",
  "ai-search-discoverability",
  "company-domain-hosting-ssl",
]);

export const companyHomepageServiceFaqs = selectFaqs([
  "company-homepage-time-and-cost",
  "cms-content-updates",
  "search-engine-optimization",
  "ai-search-discoverability",
  "responsive-company-homepage",
  "company-domain-hosting-ssl",
]);

export const homeFaqs = commonFaqs;
```

## Address contract

- Category URLs stay `/faq#general`, `/faq#pricing`, `/faq#timeline`, `/faq#tech`, `/faq#after-launch`, `/faq#mvp`, `/faq#app`, and `/faq#company-homepage`.
- Canonical question URLs use `/faq#<faq-id>`, for example `/faq#delivery-timeline` and `/faq#app-store-registration`.
- The repeated `delivery-timeline` record appears in both General and Timeline. General owns the canonical `id="delivery-timeline"`; the Timeline occurrence uses the stable alias `id="timeline-delivery-timeline"` solely to keep HTML IDs unique.
- Service pages may use the same item IDs for local deep links, such as `/service/app#app-store-registration`, but all externally presented canonical FAQ links should point to `/faq#app-store-registration`.

## File structure after the change

| File                                                                                  | Responsibility                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/web/content/faqs.ts`                                                            | Canonical FAQ registry, stable ID type, selector, hub/home/service projections |
| `apps/web/app/faq/content.ts`                                                         | FAQ category/navigation metadata and `getFaqAnchorId(categoryId, faqId)`       |
| `apps/web/lib/faq-content.test.ts`                                                    | Runtime registry, projection, canonical-answer, and unique-anchor contracts    |
| `apps/web/components/FaqHashTarget.tsx`                                               | Nonvisual client effect that opens a hashed `details` target                   |
| `apps/web/components/FaqHashTarget.test.mjs`                                          | Listener, cleanup, and direct-target source contract                           |
| `apps/web/components/FaqSection.tsx`                                                  | Shared service/home FAQ semantic rendering with IDs and `h3` questions         |
| `apps/web/components/FaqSection.module.css`                                           | Existing visual rules plus heading reset and hash offset                       |
| `apps/web/components/FaqSection.test.mjs`                                             | Shared renderer semantic and visual-preservation source contract               |
| `apps/web/app/faq/page.tsx`                                                           | Category links, stable question anchors, `h3` questions, hash target behavior  |
| `apps/web/app/faq/page.module.css`                                                    | Existing visual rules plus link/heading resets and question hash offset        |
| `apps/web/app/{content.ts,page.tsx,page.test.mjs}`                                    | Home data without copied FAQs; home consumes `homeFaqs`                        |
| `apps/web/app/service/{mvp,app,company-homepage}/{content.ts,page.tsx,page.test.mjs}` | Route-only data without copied FAQs; pages consume central projections         |

---

### Task 1: Establish the canonical FAQ registry

**Files:**

- Create: `apps/web/content/faqs.ts`
- Create: `apps/web/lib/faq-content.test.ts`
- Modify: `apps/web/app/faq/content.ts:1-329`
- Modify: `apps/web/app/faq/page.test.mjs:36-65`

**Interfaces:**

- Produces: `FaqRecord`, `FaqId`, `faqById`, `selectFaqs`, `commonFaqs`, `pricingFaqs`, `timelineFaqs`, `techFaqs`, `afterLaunchFaqs`, `mvpFaqs`, `appFaqs`, `appServiceFaqs`, `companyHomepageFaqs`, `companyHomepageServiceFaqs`, and `homeFaqs` from `apps/web/content/faqs.ts`.
- Produces: `getFaqAnchorId(categoryId: string, faqId: FaqId): string` from `apps/web/app/faq/content.ts`.
- Invariant: every projected item is the exact object stored at `faqById[item.id]`.

- [ ] **Step 1: Capture the closed-state visual baseline before changing code**

Run the web dev server in one terminal:

```bash
pnpm --filter web dev
```

Capture all affected routes in another terminal:

```bash
for route in faq service/mvp service/app service/company-homepage; do
  pnpm screenshot -- "http://127.0.0.1:3000/$route" --output "/tmp/zerosourcing-faq-ui/before/$route"
done
pnpm screenshot -- "http://127.0.0.1:3000/" --output "/tmp/zerosourcing-faq-ui/before/home"
```

Expected: 20 PNG files exist under `/tmp/zerosourcing-faq-ui/before`, covering four widths for five routes.

- [ ] **Step 2: Write the failing runtime registry test**

Create `apps/web/lib/faq-content.test.ts` with tests that import every interface listed above and assert:

```ts
import { describe, expect, it } from "vitest";

import {
  afterLaunchFaqs,
  appFaqs,
  appServiceFaqs,
  commonFaqs,
  companyHomepageFaqs,
  companyHomepageServiceFaqs,
  faqById,
  homeFaqs,
  mvpFaqs,
  pricingFaqs,
  techFaqs,
  timelineFaqs,
} from "../content/faqs";
import { categories, getFaqAnchorId } from "../app/faq/content";

const projections = [
  commonFaqs,
  pricingFaqs,
  timelineFaqs,
  techFaqs,
  afterLaunchFaqs,
  mvpFaqs,
  appFaqs,
  appServiceFaqs,
  companyHomepageFaqs,
  companyHomepageServiceFaqs,
  homeFaqs,
] as const;

describe("canonical FAQ content", () => {
  it("keeps registry keys and stable IDs aligned", () => {
    for (const [id, faq] of Object.entries(faqById)) {
      expect(faq.id).toBe(id);
    }
  });

  it("projects the canonical object instead of copying answers", () => {
    for (const items of projections) {
      for (const faq of items) {
        expect(faq).toBe(faqById[faq.id]);
      }
    }
  });

  it("uses the FAQ hub answer on every repeated surface", () => {
    expect(faqById["dual-platform-app-delivery"].answer).toBe(
      "네. 제로소싱은 웹뷰 하이브리드 방식으로 한 번 개발해 iOS와 안드로이드에 동시 출시합니다.",
    );
    expect(faqById["app-store-registration"].answer).toBe(
      "네. 개발자 계정 설정 안내부터 스토어 등록 자료 준비, 심사 대응까지 함께 진행합니다.",
    );
    expect(faqById["cms-content-updates"].answer).toBe(
      "네. 글과 이미지를 직접 바꿀 수 있는 콘텐츠 관리 기능(CMS)을 기본 제공합니다.",
    );
    expect(faqById["search-engine-optimization"].answer).toBe(
      "네. 메타태그, 사이트맵, 구조화 데이터, 페이지 속도처럼 기본 SEO 세팅을 함께 적용합니다.",
    );
    expect(faqById["ai-search-discoverability"].answer).toBe(
      "회사와 서비스 정보를 구조화해 AI가 인용하기 쉬운 형태로 정리합니다.",
    );
    expect(faqById["company-domain-hosting-ssl"].answer).toBe(
      "네. 도메인 연결, 서버 배포, SSL 보안 설정까지 함께 진행할 수 있습니다.",
    );
  });

  it("gives every FAQ-hub occurrence a unique stable anchor", () => {
    const anchors = categories.flatMap((category) =>
      category.items.map((faq) => getFaqAnchorId(category.id, faq.id)),
    );
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(getFaqAnchorId("general", "delivery-timeline")).toBe(
      "delivery-timeline",
    );
    expect(getFaqAnchorId("timeline", "delivery-timeline")).toBe(
      "timeline-delivery-timeline",
    );
  });
});
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter web exec vitest run lib/faq-content.test.ts
```

Expected: FAIL because `apps/web/content/faqs.ts`, its exports, and `getFaqAnchorId` do not exist.

- [ ] **Step 4: Implement the registry and projections**

Create `apps/web/content/faqs.ts` using the complete 43-row inventory and approved-answer table above. Each inventory ID becomes the object key and the record's `id`; each question is copied from the inventory; each answer is copied from its named authoritative source. Define records with this exact type:

```ts
export type FaqRecord = {
  readonly answer: string;
  readonly id: string;
  readonly question: string;
};
```

Declare `faqById` next as an object containing every inventory row and no additional record, ending the declaration with:

```ts
as const satisfies Record<string, FaqRecord>;
```

Then expose the registry-derived types and selector exactly as follows:

```ts
export type FaqId = keyof typeof faqById;
export type FaqItem = (typeof faqById)[FaqId];

export function selectFaqs(ids: readonly FaqId[]): readonly FaqItem[] {
  return ids.map((id) => faqById[id]);
}
```

Add the exact projection declarations from “Required projections.”

In `apps/web/app/faq/content.ts`, keep `FaqCategory`, `FaqCategoryNavItem`, `FaqCategoryNavGroup`, `categories`, and `navGroups`, but import their item lists and `FaqId` from `../../content/faqs`. Add the only alias rule:

```ts
export function getFaqAnchorId(categoryId: string, faqId: FaqId): string {
  return categoryId === "timeline" && faqId === "delivery-timeline"
    ? "timeline-delivery-timeline"
    : faqId;
}
```

Do not copy any `question` or `answer` literal into `apps/web/app/faq/content.ts`.

- [ ] **Step 5: Update the FAQ content ownership source test**

Change `apps/web/app/faq/page.test.mjs` so it expects `categories` and `navGroups` in route content, expects FAQ arrays from `../../content/faqs`, and rejects `question:` or `answer:` literals in route content.

- [ ] **Step 6: Run the focused tests and verify they pass**

Run:

```bash
pnpm --filter web exec vitest run lib/faq-content.test.ts
pnpm --filter web exec node --test app/faq/page.test.mjs
```

Expected: both commands PASS.

- [ ] **Step 7: Commit the canonical registry**

```bash
git add apps/web/content/faqs.ts apps/web/lib/faq-content.test.ts apps/web/app/faq/content.ts apps/web/app/faq/page.test.mjs
git commit -m "refactor(faq): centralize canonical answers"
```

---

### Task 2: Rewire every FAQ consumer to the canonical projections

**Files:**

- Modify: `apps/web/app/content.ts:168-204`
- Modify: `apps/web/app/page.tsx:1-35`
- Modify: `apps/web/app/page.test.mjs:130-165`
- Modify: `apps/web/app/service/mvp/content.ts:84-110`
- Modify: `apps/web/app/service/mvp/page.tsx:1-20`
- Modify: `apps/web/app/service/mvp/page.test.mjs:20-55`
- Modify: `apps/web/app/service/app/content.ts:138-169`
- Modify: `apps/web/app/service/app/page.tsx:1-24`
- Modify: `apps/web/app/service/app/page.test.mjs:36-65`
- Modify: `apps/web/app/service/company-homepage/content.ts:68-100`
- Modify: `apps/web/app/service/company-homepage/page.tsx:1-20`
- Modify: `apps/web/app/service/company-homepage/page.test.mjs:42-80`

**Interfaces:**

- Consumes: central projections created in Task 1.
- Invariant: route-local content modules contain no FAQ question or answer literals.
- Invariant: app and company-homepage service pages use the FAQ-hub-approved short answers through object identity, not copied strings.

- [ ] **Step 1: Update route tests first**

Change each source test to require these imports and reject its former local FAQ export:

```ts
// app/page.tsx
import { homeFaqs } from "../content/faqs";

// service/mvp/page.tsx
import { mvpFaqs } from "../../../content/faqs";

// service/app/page.tsx
import { appServiceFaqs } from "../../../content/faqs";

// service/company-homepage/page.tsx
import { companyHomepageServiceFaqs } from "../../../content/faqs";
```

The app page must render `items={appServiceFaqs}`. The company-homepage page must render `items={companyHomepageServiceFaqs}`. MVP and home keep their current visible list lengths and order.

- [ ] **Step 2: Run the route tests and verify they fail**

Run:

```bash
pnpm --filter web exec node --test app/page.test.mjs app/service/mvp/page.test.mjs app/service/app/page.test.mjs app/service/company-homepage/page.test.mjs
```

Expected: FAIL because pages still import local FAQ arrays.

- [ ] **Step 3: Remove copied arrays and import central projections**

Delete only `homeFaqs`, `mvpFaqs`, `appFaqs`, and `companyHomepageFaqs` declarations from their route-local `content.ts` files. Preserve every unrelated export and its order. Update the four pages to use the imports and prop names from Step 1.

- [ ] **Step 4: Run consumer and canonical-content tests**

Run:

```bash
pnpm --filter web exec node --test app/page.test.mjs app/service/mvp/page.test.mjs app/service/app/page.test.mjs app/service/company-homepage/page.test.mjs
pnpm --filter web exec vitest run lib/faq-content.test.ts
```

Expected: PASS. The runtime test proves repeated surfaces use the same registry object.

- [ ] **Step 5: Commit the consumer migration**

```bash
git add apps/web/app/content.ts apps/web/app/page.tsx apps/web/app/page.test.mjs apps/web/app/service/mvp/content.ts apps/web/app/service/mvp/page.tsx apps/web/app/service/mvp/page.test.mjs apps/web/app/service/app/content.ts apps/web/app/service/app/page.tsx apps/web/app/service/app/page.test.mjs apps/web/app/service/company-homepage/content.ts apps/web/app/service/company-homepage/page.tsx apps/web/app/service/company-homepage/page.test.mjs
git commit -m "refactor(web): consume canonical faq lists"
```

---

### Task 3: Add stable anchors, real links, headings, and hash opening

**Files:**

- Create: `apps/web/components/FaqHashTarget.tsx`
- Create: `apps/web/components/FaqHashTarget.test.mjs`
- Create: `apps/web/components/FaqSection.test.mjs`
- Modify: `apps/web/components/FaqSection.tsx:7-43`
- Modify: `apps/web/components/FaqSection.module.css:1-68`
- Modify: `apps/web/app/faq/page.tsx:1-218`
- Modify: `apps/web/app/faq/page.module.css:20-258`
- Modify: `apps/web/app/faq/page.test.mjs:67-150`

**Interfaces:**

- Consumes: `FaqItem.id` and `getFaqAnchorId` from Tasks 1–2.
- Produces: `FaqHashTarget`, a Client Component with no rendered DOM.
- Invariant: question markup is `details > summary > h3`, uses existing visual classes, and retains the explicit chevron/divider DOM.
- Invariant: `/faq/layout.tsx` remains unchanged because hash fragments share the `/faq` document title and canonical URL.

- [ ] **Step 1: Write failing semantic source tests**

Update `apps/web/app/faq/page.test.mjs` and create the two component tests to assert:

```js
// FAQ page navigation
assert.match(page, /<a[\s\S]*?href=\{`#\$\{item\.id\}`\}/);
assert.doesNotMatch(page, /<button[\s\S]*?handleNavClick/);
assert.match(page, /window\.history\.pushState\(null, "", `#\$\{id\}`\)/);

// FAQ page questions
assert.match(page, /id=\{getFaqAnchorId\(category\.id, faq\.id\)\}/);
assert.match(page, /<h3 className=\{styles\.question\}>/);
assert.doesNotMatch(page, /<span className=\{styles\.question\}>/);

// Shared FAQ renderer
assert.match(component, /id=\{faq\.id\}/);
assert.match(component, /<h3 className=\{styles\.question\}>/);
assert.match(component, /<FaqHashTarget \/>/);

// Nonvisual hash behavior
assert.match(hashTarget, /^"use client";/);
assert.match(hashTarget, /target instanceof HTMLDetailsElement/);
assert.match(hashTarget, /target\.open = true/);
assert.match(hashTarget, /addEventListener\("hashchange"/);
assert.match(hashTarget, /removeEventListener\("hashchange"/);
```

Keep all existing approved visual-value assertions. Update only the assertions that intentionally change from `button` to `a`, from `span` to `h3`, or add IDs.

- [ ] **Step 2: Run the focused source tests and verify they fail**

Run:

```bash
pnpm --filter web exec node --test app/faq/page.test.mjs components/FaqHashTarget.test.mjs components/FaqSection.test.mjs
```

Expected: FAIL because stable question anchors, links, headings, and `FaqHashTarget` are absent.

- [ ] **Step 3: Add the nonvisual hash target component**

Create `apps/web/components/FaqHashTarget.tsx` with this implementation:

```tsx
"use client";

import { useEffect } from "react";

function revealHashTarget() {
  const id = decodeURIComponent(window.location.hash.slice(1));

  if (!id) {
    return;
  }

  const target = document.getElementById(id);

  if (!(target instanceof HTMLDetailsElement)) {
    return;
  }

  target.open = true;
  window.requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start" });
  });
}

export function FaqHashTarget() {
  useEffect(() => {
    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);

    return () => {
      window.removeEventListener("hashchange", revealHashTarget);
    };
  }, []);

  return null;
}
```

This effect runs after hydration, so it does not change the server-rendered closed state or cause a hydration mismatch.

- [ ] **Step 4: Add IDs and `h3` semantics to the shared renderer**

In `FaqSection.tsx`, import the central `FaqItem` type instead of declaring a local question/answer type. Render one `<FaqHashTarget />` before the list, key rows with `faq.id`, apply `id={faq.id}` to `details`, and replace only the visible question `span` with:

```tsx
<h3 className={styles.question}>Q. {faq.question}</h3>
```

Keep summary, chevron, answer, divider, and their order unchanged.

In `FaqSection.module.css`, add only:

```css
.item {
  scroll-margin-top: 132px;
}

.question {
  margin: 0;
}
```

Merge those declarations into the existing selectors rather than creating duplicate selector blocks.

- [ ] **Step 5: Convert category buttons to links without changing visuals**

In `app/faq/page.tsx`, import `type MouseEvent` from React and change `handleNavClick` to the exact signature below. It must call `event.preventDefault()`, update the address, and retain the existing reduced-motion `scrollIntoView` call and pending active-state logic.

```tsx
const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
  event.preventDefault();
  window.history.pushState(null, "", `#${id}`);
  pendingIdRef.current = id;
  setActiveId(id);
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
};
```

Replace each navigation `button` with:

```tsx
<a
  aria-current={isActive ? "true" : undefined}
  className={isActive ? styles.navItemActive : styles.navItem}
  href={`#${item.id}`}
  key={item.id}
  onClick={(event) => handleNavClick(event, item.id)}
>
  <Icon name={item.icon} size={16} />
  <span>{item.title}</span>
</a>
```

Do not add `role="button"`; this is navigation and must retain link semantics.

- [ ] **Step 6: Add question anchors and headings to the FAQ hub**

Import `FaqHashTarget` and `getFaqAnchorId`. Render one `<FaqHashTarget />` once inside the page. Key each row with `getFaqAnchorId(category.id, faq.id)`, apply the same result as the `details` ID, and replace the question `span` with the same `h3` markup used by `FaqSection`.

In `page.module.css`, add `text-decoration: none` to the existing combined `.navItem, .navItemActive` selector, `margin: 0` to `.question`, and `scroll-margin-top: 132px` to `.faqItem`. Do not change any existing value.

- [ ] **Step 7: Run semantic, React, and type checks**

Run:

```bash
pnpm --filter web exec node --test app/faq/page.test.mjs components/FaqHashTarget.test.mjs components/FaqSection.test.mjs
pnpm --filter web lint
pnpm --filter web check-types
```

Expected: all commands PASS with no React-hook, hydration, accessibility, or TypeScript errors.

- [ ] **Step 8: Commit addressability and semantic markup**

```bash
git add apps/web/components/FaqHashTarget.tsx apps/web/components/FaqHashTarget.test.mjs apps/web/components/FaqSection.tsx apps/web/components/FaqSection.module.css apps/web/components/FaqSection.test.mjs apps/web/app/faq/page.tsx apps/web/app/faq/page.module.css apps/web/app/faq/page.test.mjs
git commit -m "feat(faq): add stable answer anchors"
```

---

### Task 4: Verify visual parity and full behavior

**Files:**

- Verify only; no source file should change unless a failing check exposes a scoped defect.

**Interfaces:**

- Consumes: completed registry, consumers, semantic rendering, and hash behavior.
- Produces: test output and `/tmp/zerosourcing-faq-ui/after` visual artifacts.

- [ ] **Step 1: Run the complete web test suite**

```bash
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```

Expected: all tests, lint, type generation/checking, and the production build PASS.

- [ ] **Step 2: Capture post-change screenshots**

With the web dev server running, execute:

```bash
for route in faq service/mvp service/app service/company-homepage; do
  pnpm screenshot -- "http://127.0.0.1:3000/$route" --output "/tmp/zerosourcing-faq-ui/after/$route"
done
pnpm screenshot -- "http://127.0.0.1:3000/" --output "/tmp/zerosourcing-faq-ui/after/home"
```

- [ ] **Step 3: Enforce closed-state pixel equality**

```bash
for before in $(find /tmp/zerosourcing-faq-ui/before -name '*.png' | sort); do
  after=${before/\/before\//\/after\/}
  cmp "$before" "$after"
done
```

Expected: every `cmp` exits 0. If any file differs, inspect the pair and fix only unintended anchor/link/heading default-style differences. Do not accept approximate parity.

- [ ] **Step 4: Manually verify deep-link behavior**

Check these exact scenarios in desktop Chrome and at 390 px width:

1. Open `/faq#app-store-registration`: the page scrolls to the question below the fixed header and that `details` is open.
2. Open `/faq#delivery-timeline`: the General occurrence opens with the approved common FAQ answer.
3. Open `/faq#timeline-delivery-timeline`: the Timeline occurrence opens with the same approved answer.
4. Click each desktop category link: the URL hash changes, smooth scrolling remains, active styling remains, and reduced-motion mode removes smooth animation.
5. Expand FAQ rows normally: native keyboard activation, chevron rotation, dividers, answer padding, and multi-open behavior remain unchanged.
6. Inspect the document outline: one `h1`, category `h2` headings, and question `h3` headings are present.
7. Confirm `/faq` still emits the existing document title and canonical link; fragments do not create separate metadata.
8. Confirm `/service/app` and `/service/company-homepage` show the FAQ-hub-approved answers when the six changed rows are opened.

- [ ] **Step 5: Review the final diff for scope and React quality**

```bash
git diff --check
git diff --stat HEAD~3..HEAD
git diff HEAD~3..HEAD -- apps/web/content/faqs.ts apps/web/app/faq apps/web/components/FaqSection.tsx apps/web/components/FaqHashTarget.tsx apps/web/app/content.ts apps/web/app/service
```

Confirm no unrelated files, visual values, per-question routes, structured data, or new dependencies entered the diff. Apply the React checklist: listener cleanup is symmetric, only one hash listener renders per page, no browser API runs during render, props crossing Server/Client boundaries are serializable, and list keys use stable IDs.

---

## Completion criteria

- All six cross-page answer differences use the exact FAQ-hub answer.
- The duplicated development-duration question uses one central answer object in both FAQ categories and home.
- Route-local content modules contain no FAQ answer copies.
- Every question has a stable ID, deep link, and `h3` heading.
- Category navigation uses links and updates the address.
- Direct question hashes open and reveal the answer.
- `/faq` metadata remains unchanged; no thin question routes are added.
- Closed-state screenshots are byte-identical at all required routes and widths.
- Unit, Node, lint, type, and production build checks pass.
