# Organization JSON-LD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 제로소싱 조직과 제공 서비스를 설명하는 유효한 Organization JSON-LD를 공개 홈페이지에 한 번만 노출한다.

**Architecture:** 구조화 데이터 원문은 JSON 파일로 분리해 문법 검증과 사실값 회귀 테스트가 가능하게 하고, Next.js 홈페이지 서버 컴포넌트가 네이티브 `<script type="application/ld+json">`로 직렬화한다. 전역 레이아웃에는 넣지 않아 모든 하위 페이지에 동일한 Organization 데이터가 중복되지 않게 한다.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, JSON-LD, Schema.org, Node.js test runner

## Global Constraints

- 대상은 공개 사이트 `apps/web`이며 Vite 관리자 앱 `app/admin`에는 추가하지 않는다.
- Organization JSON-LD는 홈페이지 `/`에만 1회 렌더링한다.
- `ProfessionalService`는 Schema.org에서 deprecated 상태이므로 `@type`은 `Organization`만 사용한다.
- 공개 페이지와 다른 사실을 구조화 데이터에 넣지 않는다.
- 대표 이메일은 현재 공개 페이지의 `contact@zerofee.kr`로 통일한다.
- 주소는 현재 About/Footer의 `경기도 고양시 덕양구 동축로70, A동 9층 901호(동산동, 현대프리미어캠퍼스)`와 일치시킨다.
- `sameAs`에는 자사 홈페이지가 아닌 외부 공식 프로필만 허용한다. 확인된 외부 프로필이 없으므로 이번 변경에서는 속성을 생략한다.
- 저장소에 없는 `https://zerosourcing.kr/og-image.png`는 이번 JSON-LD에서 생략한다.
- 로고는 기존 `apps/web/public/figma-icons/ZerosourcingLogo.svg`의 심볼 경로를 그대로 재사용한 512x512 정사각형 SVG를 사용한다. 새 디자인을 만들지 않는다.
- `founder: 이동규`는 사용자 제공 정보로 반영하되, 대표자와 창업자가 다르면 배포 전에 해당 속성만 제거한다.

---

## File Structure

- Create: `apps/web/app/organization-json-ld.json` — 검색엔진에 전달할 조직/서비스 사실값의 단일 원본
- Create: `apps/web/app/organization-json-ld.test.mjs` — JSON 문법, 사실값, 홈페이지 렌더 연결, 로고 규격 회귀 테스트
- Create: `apps/web/public/brand/zerosourcing-mark.svg` — 기존 로고 심볼을 재사용한 크롤링 가능한 512x512 조직 로고
- Modify: `apps/web/app/page.tsx` — 홈페이지에서 JSON-LD를 네이티브 script 태그로 1회 렌더링

## Corrected Data Decisions

원문은 다음 이유로 그대로 사용할 수 없다.

- `"@type": "Organization", "ProfessionalService"`는 JSON 문법 오류이며 `ProfessionalService` 자체도 deprecated다.
- `"alternateName": "제로소싱", "zerosourcing"`도 JSON 문법 오류다. 여러 이름은 배열이어야 한다.
- 최상위 `email`은 `contact@zerofee.kr`, `contactPoint.email`은 `hello@zerosourcing.kr`로 서로 다르다. 현재 공개 페이지의 전자를 사용한다.
- 원문의 주소는 현재 About/Footer에 표시된 `9층` 정보가 빠져 있다.
- `/logo.png`, `/og-image.png` 파일은 현재 `apps/web/public`에 없다.
- `sameAs`에 자사 홈페이지를 다시 넣는 것은 속성의 목적과 맞지 않는다.
- 강의 플랫폼과 온라인 쇼핑몰은 홈페이지 문장에는 노출되지만 전용 서비스 페이지가 없다. 서비스명과 `serviceType`만 표기하고, 현재 화면에서 확인할 수 없는 상세 기능 설명과 URL은 넣지 않는다.

---

### Task 1: Add a valid, testable Organization data source

**Files:**
- Create: `apps/web/app/organization-json-ld.json`
- Create: `apps/web/app/organization-json-ld.test.mjs`

**Interfaces:**
- Consumes: 현재 홈페이지/서비스 페이지의 공개 문구와 `apps/web/app/about/content.ts`의 회사 정보
- Produces: `page.tsx`가 import할 정적 JSON 객체

- [ ] **Step 1: Write the failing data-contract test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataPath = new URL("./organization-json-ld.json", import.meta.url);

test("organization JSON-LD is valid and matches public company facts", async () => {
  const jsonLd = JSON.parse(await readFile(dataPath, "utf8"));

  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.equal(jsonLd["@type"], "Organization");
  assert.equal(jsonLd.name, "제로소싱");
  assert.deepEqual(jsonLd.alternateName, ["ZeroSourcing", "제로피(제로소싱)"]);
  assert.equal(jsonLd.email, "contact@zerofee.kr");
  assert.equal(jsonLd.contactPoint.email, jsonLd.email);
  assert.equal(
    jsonLd.address.streetAddress,
    "덕양구 동축로70, A동 9층 901호(동산동, 현대프리미어캠퍼스)",
  );
  assert.equal(jsonLd.sameAs, undefined);
  assert.equal(jsonLd.image, undefined);
  assert.equal(jsonLd.hasOfferCatalog.itemListElement.length, 5);
});
```

- [ ] **Step 2: Run the test and verify the missing-file failure**

Run: `node --test apps/web/app/organization-json-ld.test.mjs`

Expected: FAIL with `ENOENT` for `organization-json-ld.json`.

- [ ] **Step 3: Add the corrected JSON-LD data**

Create `apps/web/app/organization-json-ld.json` with this complete object:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://zerosourcing.kr/#organization",
  "name": "제로소싱",
  "legalName": "제로피",
  "alternateName": ["ZeroSourcing", "제로피(제로소싱)"],
  "url": "https://zerosourcing.kr",
  "logo": "https://zerosourcing.kr/brand/zerosourcing-mark.svg",
  "email": "contact@zerofee.kr",
  "description": "MVP 개발 외주 전문 기업. 과한 스펙도 긴 일정도 없이 핵심 기능만 담아 평균 4주 만에 출시·검증하는 개발 파트너. MVP 개발, 하이브리드 앱 개발, 기업 홈페이지 제작, 인터넷 강의 홈페이지 제작, 온라인 쇼핑몰 제작을 제공하며, 기능 항목별 정찰가로 견적이 투명하고 버그를 영구 보장한다.",
  "slogan": "부담은 제로, 출시는 현실로",
  "areaServed": {
    "@type": "Country",
    "name": "대한민국",
    "sameAs": "https://www.wikidata.org/wiki/Q884"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "덕양구 동축로70, A동 9층 901호(동산동, 현대프리미어캠퍼스)",
    "addressLocality": "고양시",
    "addressRegion": "경기도",
    "addressCountry": "KR"
  },
  "founder": {
    "@type": "Person",
    "name": "이동규"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "contact@zerofee.kr",
    "contactType": "sales",
    "areaServed": "KR",
    "availableLanguage": "Korean"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "개발 외주 서비스",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "MVP 개발",
          "description": "검증에 필요한 핵심 기능만 담아 평균 4주 만에 출시하는 MVP 개발 외주 서비스. 정부지원사업 자금으로 개발비 집행이 가능하다.",
          "serviceType": "MVP 개발",
          "url": "https://zerosourcing.kr/service/mvp"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "하이브리드 앱 개발",
          "description": "웹뷰 하이브리드 방식으로 한 번 개발해 iOS·안드로이드에 동시 출시하고, 구글·애플 스토어 등록까지 대행하는 앱 개발 서비스",
          "serviceType": "앱 개발",
          "url": "https://zerosourcing.kr/service/app"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "기업 홈페이지 제작",
          "description": "반응형과 검색엔진·생성형 AI 검색 최적화(SEO·GEO), 도메인·서버·보안까지 포함하는 기업 홈페이지 제작 서비스",
          "serviceType": "홈페이지 제작",
          "url": "https://zerosourcing.kr/service/company-homepage"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "인터넷 강의 홈페이지 제작",
          "serviceType": "온라인 강의 플랫폼 제작"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "온라인 쇼핑몰 제작",
          "serviceType": "쇼핑몰 제작"
        }
      }
    ]
  },
  "knowsAbout": [
    "MVP 개발",
    "MVP 개발 외주",
    "MVP 개발 비용",
    "하이브리드 앱 개발",
    "기업 홈페이지 제작",
    "인터넷 강의 홈페이지 제작",
    "온라인 쇼핑몰 제작",
    "외주 개발",
    "정부지원사업",
    "정찰가 견적"
  ]
}
```

- [ ] **Step 4: Run the data-contract test**

Run: `node --test apps/web/app/organization-json-ld.test.mjs`

Expected: PASS, 1 test passed.

---

### Task 2: Add a compliant square organization logo

**Files:**
- Create: `apps/web/public/brand/zerosourcing-mark.svg`
- Modify: `apps/web/app/organization-json-ld.test.mjs`

**Interfaces:**
- Consumes: `apps/web/public/figma-icons/ZerosourcingLogo.svg`의 첫 두 path인 기존 제로소싱 심볼
- Produces: `https://zerosourcing.kr/brand/zerosourcing-mark.svg`에서 제공될 512x512 로고

- [ ] **Step 1: Extend the failing test for the logo asset**

```js
const logoPath = new URL("../public/brand/zerosourcing-mark.svg", import.meta.url);

test("organization logo is a 512px square SVG", async () => {
  const logo = await readFile(logoPath, "utf8");

  assert.match(logo, /<svg[^>]*width="512"[^>]*height="512"/);
  assert.match(logo, /viewBox="0 0 26 24"/);
  assert.match(logo, /fill="#0360EF"/);
  assert.match(logo, /fill="#F8FAFF"/);
});
```

- [ ] **Step 2: Run the test and verify the missing-file failure**

Run: `node --test apps/web/app/organization-json-ld.test.mjs`

Expected: FAIL with `ENOENT` for `zerosourcing-mark.svg`.

- [ ] **Step 3: Create the square SVG from the existing brand paths**

Create `apps/web/public/brand/zerosourcing-mark.svg` with the existing symbol paths and no wordmark paths:

```svg
<svg
  width="512"
  height="512"
  viewBox="0 0 26 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <path d="M1.38868 23.7409C1.22254 23.8516 1 23.7325 1 23.5329L0.999999 0.250002C0.999999 0.111931 1.11193 1.90246e-06 1.25 1.89642e-06L24.75 8.69203e-07C24.8881 8.63168e-07 25 0.11193 25 0.250001L25 23.5329C25 23.7325 24.7775 23.8516 24.6113 23.7409L22.1387 22.0924C22.0547 22.0365 21.9453 22.0365 21.8613 22.0924L19.1387 23.9075C19.0547 23.9635 18.9453 23.9635 18.8613 23.9075L16.1387 22.0924C16.0547 22.0365 15.9453 22.0365 15.8613 22.0924L13.1387 23.9075C13.0547 23.9635 12.9453 23.9635 12.8613 23.9075L10.1387 22.0924C10.0547 22.0365 9.9453 22.0365 9.86132 22.0924L7.13867 23.9075C7.0547 23.9635 6.9453 23.9635 6.86132 23.9075L4.13867 22.0925C4.0547 22.0365 3.9453 22.0365 3.86132 22.0925L1.38868 23.7409Z" fill="#0360EF"/>
  <path d="M17.7859 7.43457L17.6931 7.53516L12.2742 13.4248H18.1433V16.2861H7.85718V13.9756L7.94995 13.875L13.3337 8.02148H8.2312V5.14258H17.7859V7.43457Z" fill="#F8FAFF"/>
</svg>
```

- [ ] **Step 4: Run the test**

Run: `node --test apps/web/app/organization-json-ld.test.mjs`

Expected: PASS, 2 tests passed.

---

### Task 3: Render JSON-LD once on the homepage

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/organization-json-ld.test.mjs`

**Interfaces:**
- Consumes: default import `organizationJsonLd` from `./organization-json-ld.json`
- Produces: 홈페이지 HTML에 포함되는 단일 `application/ld+json` script

- [ ] **Step 1: Add a failing source-contract test**

```js
const pagePath = new URL("./page.tsx", import.meta.url);

test("home page renders the organization JSON-LD safely once", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /import organizationJsonLd from "\.\/organization-json-ld\.json";/);
  assert.equal((page.match(/type="application\/ld\+json"/g) ?? []).length, 1);
  assert.match(page, /JSON\.stringify\(organizationJsonLd\)\.replace\(\/<\/g, "\\\\u003c"\)/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test apps/web/app/organization-json-ld.test.mjs`

Expected: FAIL because `page.tsx` does not import or render the JSON-LD yet.

- [ ] **Step 3: Render a native script as the first homepage child**

Add this import to `apps/web/app/page.tsx`:

```tsx
import organizationJsonLd from "./organization-json-ld.json";
```

Add this as the first child of `<main className={styles.page}>`:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
  }}
/>
```

Do not use `next/script`; JSON-LD is data, not executable JavaScript.

- [ ] **Step 4: Run the focused test**

Run: `node --test apps/web/app/organization-json-ld.test.mjs`

Expected: PASS, 3 tests passed.

---

### Task 4: Verify generated HTML and production safety

**Files:**
- Verify only: `apps/web/app/page.tsx`
- Verify only: `apps/web/app/organization-json-ld.json`
- Verify only: `apps/web/public/brand/zerosourcing-mark.svg`

**Interfaces:**
- Consumes: completed homepage JSON-LD implementation
- Produces: build-verified, crawler-visible Organization data

- [ ] **Step 1: Run all static checks**

Run:

```bash
node --test apps/web/app/organization-json-ld.test.mjs
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

Expected: all commands exit 0; Next.js build lists `/` successfully.

- [ ] **Step 2: Inspect the rendered homepage HTML**

Run the production server with `pnpm --filter web start`, then in another terminal run:

```bash
curl -s http://localhost:3000/ | rg -o '<script type="application/ld\+json">.*</script>'
```

Expected: exactly one script containing `"@id":"https://zerosourcing.kr/#organization"`.

- [ ] **Step 3: Validate the exact payload externally**

Paste the script payload into both validators:

- `https://validator.schema.org/`
- `https://search.google.com/test/rich-results`

Expected: no JSON parse errors and one Organization entity detected. Google may show recommendations, but no critical syntax error is acceptable.

- [ ] **Step 4: Commit the focused change**

```bash
git add apps/web/app/page.tsx apps/web/app/organization-json-ld.json apps/web/app/organization-json-ld.test.mjs apps/web/public/brand/zerosourcing-mark.svg
git commit -m "feat(seo): add organization structured data"
```

---

## Explicitly Out of Scope

- `apps/web/app/layout.tsx`의 현재 `Create Next App` metadata와 `<html lang="en">` 교정
- Open Graph용 1200x630 이미지 제작 및 `openGraph`/Twitter metadata 연결
- `robots.ts`, `sitemap.ts` 추가
- FAQ, Article, Breadcrumb, Service별 JSON-LD 추가

이 항목들은 발견된 SEO 후속 작업이지만 Organization JSON-LD 삽입과는 독립적으로 검토한다.
