# Zerosourcing Web 프론트엔드 하드닝 구현 계획

> **구현 에이전트용:** 이 계획을 실행할 때는 `superpowers:executing-plans` 방식으로 한 단계씩 구현하고, 각 단계의 검증 결과를 남긴다.

**목표:** `apps/web`을 “빌드되는 마케팅 사이트”에서 “공개해도 되는 사실·콘텐츠, 예측 가능한 App Router 경계, 설명 가능한 반응형 규칙, 측정 가능한 성능 예산”을 가진 제품으로 끌어올린다.

**아키텍처 방향:** Root layout은 전역 문서 계약만 소유하고, URL을 바꾸지 않는 `(marketing)` route group이 Header/Footer를 소유한다. 페이지는 Server Component가 기본이며 실제 브라우저 상호작용만 작은 Client island로 남긴다. 회사 사실·FAQ·포트폴리오·실적은 canonical domain data에서 화면별 projection으로 파생한다. CSS는 숫자를 일괄 통일하지 않고 breakpoint의 역할과 컴포넌트 소유권을 먼저 정한다.

**기술 스택:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS Modules, pnpm/Turborepo, `@repo/ui`.

## 리뷰 범위와 스냅샷

- 검토 범위: `apps/web`과 이 앱이 실제 소비하는 `packages/ui` 코드
- 제외: `apps/admin`, 전담 테스트 품질 에이전트, 제품 코드 수정
- 에이전트: 루트 포함 총 5개만 사용
- 스냅샷: 2026-07-14 현재 branch와 아직 commit되지 않은 홈의 `BottomFloatingThemeSwitcherWide*` 변경까지 포함
- 확인하지 못한 것: 실서비스 RUM, 실제 CDN/range 응답, 사업자 정보와 실적의 외부 증빙, 법률 문서 적법성
- 검증 결과:
  - `pnpm --filter web lint` 통과
  - `pnpm --filter web check-types` 통과
  - `pnpm --filter web build` 통과
  - `node --test`로 발견된 source test 73개 통과
  - build 결과는 `/api/contact`만 Dynamic이고 나머지는 Static/SSG

테스트 통과는 현재 구조가 의도한 문자열과 파일 배치를 유지한다는 뜻이지, 공개 콘텐츠의 진실성·두 theme control의 런타임 상태 일치·실제 브라우저 성능까지 보장한다는 뜻은 아니다.

## CTO 최종 판정

**판정: 기능 기준은 통과, production 공개·검색 색인 기준은 보류한다.**

이번 수정으로 metadata helper, sitemap/robots, Organization JSON-LD, 동적 상세 metadata, readonly route data, 실제 Link navigation, native FAQ 구조가 좋아졌다. lint/type/build도 모두 녹색이다. 기초 체력은 분명 이전보다 나아졌다.

하지만 아래 항목은 “나중에 정리할 코드 취향”이 아니라 공개 전에 결정하거나 차단해야 할 제품 문제다.

1. 블로그 6건이 모두 `<p>HTML</p>`이고 미래 날짜인데 정적 생성·sitemap 공개 상태다.
2. 포트폴리오 상세 9건도 결과 영역이 `HTML` placeholder인데 sitemap에 들어간다.
3. About와 Footer의 전화번호가 다르고, 회사 실적·고객사·보증 표현의 사실 원본이 없다.
4. 홈에 독립 상태를 가진 theme switcher 두 개가 동시에 같은 `html[data-theme]`를 쓴다.
5. 31,182,835-byte MP4가 핵심 랜딩 5곳에서 poster 없이 자동재생된다.
6. `/color`, `/liquid-glass` 실험 화면이 production route이며 홈 canonical까지 상속한다.
7. 개인정보를 받는 폼에 실제 개인정보처리방침 연결과 abuse-control 계약이 없다.

### 상태표

| 영역                  | 판정        | 핵심 이유                                                           |
| --------------------- | ----------- | ------------------------------------------------------------------- |
| 빌드·타입 안정성      | 통과        | lint, type, production build, 73개 source test 통과                 |
| App Router/RSC        | 개선 필요   | 마케팅 shell 11벌, page-level Client 4개                            |
| 공개 콘텐츠·회사 사실 | 보류        | placeholder, 미래 게시일, 전화번호 충돌, 실적 증빙 미확정           |
| SEO/AEO/GEO           | 조건부 보류 | metadata 기반은 좋아졌지만 indexable thin/demo URL이 존재           |
| 성능                  | 보류        | 31.2MB autoplay 영상, 4.15MB exact duplicate PNG, glass 비용 무예산 |
| 디자인 시스템         | 개선 필요   | Pretendard resource 미로딩, UI primitive가 token을 우회             |
| 반응형                | 개선 필요   | 86개 media query의 역할이 문서화되지 않음                           |
| 유지보수성            | 개선 필요   | canonical data 부재, page/CSS monolith, 인라인을 강제하는 guardrail |

## 잘 고친 부분

- `site-metadata.ts`로 canonical, Open Graph, Twitter 계약을 중앙화했다.
- blog/portfolio detail이 `generateStaticParams`, async params, `notFound`, `generateMetadata`를 올바른 방향으로 사용한다.
- Organization JSON-LD를 서버 layout에서 출력하고 `<`를 escape한다.
- 홈·About·서비스 페이지가 Server Component 기본값을 유지한다.
- `FaqSection`, `ProofMetrics` 등 공유 렌더러가 readonly data를 명시적으로 받는다.
- 카드 navigation이 실제 Next `Link`를 사용하고 native `details/summary`, `dl/dt/dd`, explicit divider DOM도 사용한다.
- 오래된 전역 단일 소비 컴포넌트를 정리하려 한 ownership 의도는 맞다.

다만 마지막 항목은 “전역 `components`에서 제거”를 “모두 `page.tsx`에 인라인”으로 해석하면서 과교정됐다. 다음 단계는 전역으로 되돌리는 것이 아니라 route-private section으로 응집도를 회복하는 것이다.

## 통합 핵심 발견

### 1. 검색 최적화보다 먼저 공개할 근거를 완성해야 한다

- `apps/web/app/blog/blog-posts.ts`의 6개 글은 동일 placeholder 본문과 `2026. 11. 02` 날짜를 가진다.
- `apps/web/app/portfolio/[slug]/page.tsx`는 9개 상세에 literal `HTML`을 출력한다.
- `apps/web/app/sitemap.ts`는 이 URL을 모두 공개한다.
- `/color`, `/liquid-glass`는 sitemap 제외만으로 색인이 막히지 않으며 production HTML에서 홈 canonical이 확인됐다.
- `service/company-homepage/page.tsx`의 `.com` 예시와 “상위 노출”, “AI가 인용하게” 같은 문장은 통제 가능한 산출물보다 결과 보장에 가깝다.

schema나 `llms.txt`를 더 넣는 것이 해법이 아니다. 먼저 draft/public 상태, 고유 본문, 기준일, 작성·검토 책임, 실제 사례 근거를 갖춰야 한다.

### 2. 최신 theme 변경에는 실제 상태 소유권 버그가 있다

- `apps/web/app/page.tsx`가 pill과 wide theme switcher를 동시에 렌더한다.
- 두 컴포넌트는 각각 독립 `theme` state를 갖고 같은 `document.documentElement.dataset.theme`를 쓰며 cleanup에서도 삭제한다.
- 한 control에서 dark를 선택해도 다른 control은 light checked 상태로 남는다. 마지막으로 조작한 effect가 실제 theme를 결정한다.
- Wide switcher는 최대 1360px, 높이 80px의 fixed surface라 뒤 콘텐츠의 넓은 영역을 가리거나 pointer interaction을 막을 수 있다.
- 현재 theme token은 body/Header와 switcher 중심이고 페이지 section 전체가 일관되게 dark/dim으로 전환되는 계약도 없다.

기본 권고는 공통 store를 먼저 만드는 것이 아니다. 비교 실험이라면 production 홈에서 둘 다 제거하거나 하나만 승인하고, 나머지는 격리 preview로 옮긴다. 두 control이 동시에 필요한 제품 요구가 확정된 경우에만 상위 owner 하나와 controlled view 두 개를 만든다.

### 3. 가장 큰 성능 문제는 React 미세 최적화가 아니라 자산과 큰 glass surface다

- `public/banner_video.mp4`: 정확히 31,182,835 bytes, 5개 랜딩에서 `autoPlay loop`.
- `contact-background.png`와 `s4_bg.png`: 각각 4,154,322 bytes이고 SHA-256이 완전히 같다.
- Header와 Wide switcher는 가변 geometry liquid filter를 만들고, 두 filter manager의 `Map`과 SVG `<filter>`에는 상한·삭제 정책이 없다.
- `CardCarousel`은 같은 resize를 `ResizeObserver`와 `window.resize` 두 경로로 관찰한다.

`memo`, dynamic import, carousel library부터 추가하지 않는다. 영상/이미지와 production 실험 surface를 먼저 줄인 뒤 실제 trace로 남은 glass 비용을 판단한다.

### 4. App Router의 native 소유권을 덜 활용하고 있다

- 공개 마케팅 페이지 11개가 Header, header layer, Footer를 직접 조립한다.
- blog, portfolio, FAQ, contact는 작은 검색·필터·scrollspy·form 상태 때문에 page 전체가 Client Component다.
- route별 metadata-only layout은 있지만 공통 UI layout은 없다.

`(marketing)/layout.tsx`가 공통 chrome을 소유하고, `BlogPostExplorer`, `PortfolioFilterGrid`, `FaqCategoryNav`, `ContactForm`만 Client leaf가 되는 것이 목표다. 정적 본문이 현재도 SSR된다는 사실과 별개로, 이 변경은 hydration/JS 범위와 server-only 확장 가능성을 개선한다.

### 5. 데이터 ownership은 파일 위치가 아니라 “사실을 고치는 곳이 하나”여야 한다

- FAQ는 홈, FAQ route, 서비스 route에 중복되고 같은 질문의 답변이 이미 drift했다.
- 포트폴리오는 홈, 목록/detail data, 서비스 section에 세 벌로 존재한다.
- `172+`, `47.2%`, `평균 4주`가 여러 content 파일에 복제된다.
- 회사 정보는 About, Footer, JSON-LD에 분산되고 전화번호가 충돌한다.

권장 owner는 `apps/web/content/faqs.ts`, `portfolio.ts`, `company.ts`, `company-proof.ts`다. 화면은 stable id/slug를 명시적으로 선택한다. 카드용 짧은 문장처럼 변경 주기가 다른 presentation copy까지 억지로 합치거나 배열 `slice`로 화면 구성을 숨기지 않는다.

### 6. 중복 제거는 exact delete와 제품 결정을 분리해야 한다

안전성이 높은 삭제/통합 후보:

- SHA가 같은 PNG 한 벌: 정확히 4,154,322 bytes 절감
- import consumer 0인 `components/withGlass.tsx`
- 구현이 같은 `BlogDetailCtaButton` / `PortfolioDetailCtaButton`
- 미사용 Geist WOFF 2개와 starter SVG 2개: 총 137,655 bytes의 dead source
- consumer가 없는 saved-arrow registry가 유일하게 당기는 `components/icons.tsx` 경로: 전체 string consumer 확인 후 축소
- listener 없는 `zerosourcing:cta-click` event: 외부 tag manager 연동 확인 후 삭제

조건부 후보:

- pill/wide switcher: 먼저 제품 variant 하나를 선택한다. 두 버전을 공용 mega-component로 합치는 것은 2순위다.
- FAQ 답변: 같은 질문이라도 승인된 목적이 다르면 별도 entry로 명명한다.
- glass engine 2개: visual contract가 다르므로 파일 수만 보고 합치지 않는다.
- route-private section: 짧은 파일을 만들기 위한 분할이 아니라 책임·독립 스타일·데이터/상호작용·변경 주기 중 두 조건 이상일 때만 추출한다.

### 7. breakpoint 숫자가 아니라 역할이 뒤섞여 있다

현재 CSS에는 86개 media query가 있다.

- `max-width: 768px` 15개
- `max-width: 640px` 12개
- `max-width: 480px` 10개
- `max-width: 1080px` 10개
- `max-width: 1079px` 8개
- 그 밖에 1081, 767, 639, 479, 1439/1440/1441 등이 존재

숫자를 전역 검색·치환하면 안 된다. 다음 역할을 `design.md`에 먼저 기록한다.

1. 구조 전환: small `<=639`, medium `640-1079`, desktop `>=1080`
2. Figma reference-frame 보정: `<=640`, `<=1080`; spacing/size 조정 전용
3. SectionShell compact 계약: 기존 `<=768`
4. component-fit: 1023, 900, 720, 560, 1439/1440 등 실제 콘텐츠가 깨지는 로컬 값

확정 삭제는 base와 같은 `gap: 16px`을 다시 쓰는 `ProcessSection.module.css`의 `max-width:1080` block이다. 유일한 1081은 1080 전후에서 시각 검증 후 의도값으로 정한다. 변경 경계는 반드시 `-1 / 기준 / +1` 너비를 함께 본다.

### 8. 디자인 token은 있지만 runtime resource와 enforcement가 빠졌다

- `design-system.css`는 Pretendard를 첫 family로 선언하지만 저장소에 `@font-face`, `next/font/local`, font import가 없다.
- OS에 Pretendard가 없으면 다른 fallback으로 렌더되어 글자 폭과 줄바꿈이 달라진다.
- 반대로 Geist WOFF는 source에 있지만 사용되지 않는다. `apps/web/README.md`는 Inter를 load한다고 잘못 설명한다.
- `packages/ui/src/radio.tsx`는 CSS 문자열을 인스턴스마다 `<style>`로 출력하고 raw typography/color를 가진다.
- gradient Button의 `borderRadius:32`, `padding:"8px 20px"`가 6개 consumer에서 반복된다.
- company-homepage CSS는 이미 있는 typography utility를 직접 재작성한다.

승인된 Pretendard WOFF2와 `next/font/local`을 연결하거나, 실제 지원할 system font로 디자인 표준을 바꾼다. UI primitive 한 개씩 CSS Module/token 기반으로 옮기며 giant preset registry는 만들지 않는다.

### 9. 일부 guardrail이 좋은 구조가 아니라 현재 파일 모양을 보호한다

- home/About/service/FAQ source tests는 route-private module이 없는지, literal markup이 `page.tsx` 안에 있는지를 검사한다.
- 이 검사는 “단일 route 코드를 전역 components에 두지 않는다”는 좋은 의도를 “무조건 인라인”으로 고정한다.
- 결과적으로 410줄 page와 809줄 CSS를 다시 작은 ownership 단위로 나누려 하면 검사가 실패한다.

guardrail은 파일명과 인라인 위치보다 다음 계약을 검사해야 한다.

- route-private module을 다른 route가 import하지 않는다.
- 전역 component는 실제 다중 consumer 또는 foundational primitive 근거가 있다.
- DOM/visual contract 검증은 구현 파일 위치와 분리한다.

### 10. 공개 문의 동선과 navigation 접근성 계약이 미완성이다

- Footer의 이용약관·개인정보처리방침은 링크가 아닌 `<p>`다.
- 문의 폼의 개인정보 “보기” button은 handler가 없다.
- 공개 `/api/contact`는 서버 검증과 Slack escape는 좋지만 rate/abuse control, upstream deadline, network-error mapping이 없다.
- Header의 Service link는 실제 menu widget이 아닌데 `aria-haspopup="menu"`를 선언한다.
- mobile nav에는 Escape, focus 이동/복원 계약이 없고 active link에 `aria-current`가 없다.

법률 문서는 승인된 내용이 있어야 구현할 수 있다. abuse control은 serverless memory `Map`으로 흉내 내지 말고 배포 인프라의 rate-limit/WAF 또는 승인된 shared store 계약을 정한다.

## 실행 계획

### Task 0. 공개 차단선과 사실 원본을 먼저 세운다

**Files:**

- Create: `apps/web/content/company.ts`
- Create: `apps/web/content/company-proof.ts`
- Modify: `apps/web/app/about/content.ts`
- Modify: `apps/web/components/Footer.tsx`
- Create: `apps/web/app/organization-json-ld.ts`
- Delete: `apps/web/app/organization-json-ld.json`
- Modify: `apps/web/app/layout.tsx`, `organization-json-ld.test.mjs`, `organization-json-ld.md`
- Modify: `apps/web/app/blog/blog-posts.ts`
- Modify: `apps/web/app/blog/page.tsx`
- Modify: `apps/web/app/blog/[slug]/page.tsx`
- Modify: `apps/web/app/portfolio/portfolio-items.ts`
- Modify: `apps/web/app/portfolio/[slug]/page.tsx`
- Modify: `apps/web/app/sitemap.ts`
- Delete or isolate: `apps/web/app/color/`, `apps/web/app/liquid-glass/`

**Steps:**

1. 사업 담당자가 official phone, 법적 상호, 대표/창업자, 주소, 이메일, 고객사 사용 승인, 실적 산식·기준일·보증 범위를 승인한다.
2. typed JSON-LD builder가 `company.ts`를 import하게 하고, 확인되지 않은 전화·지표·관계·보장 문구는 화면과 JSON-LD 양쪽에서 제거한다.
3. blog/portfolio record에 `status: "draft" | "published"`를 추가하고 published projection만 목록, `generateStaticParams`, sitemap이 사용하게 한다.
4. placeholder URL은 실제 고유 본문이 준비될 때까지 생성하지 않는다.
5. demo route는 production graph에서 삭제하거나 격리 preview로 이동한다. 단순 sitemap 제외로 끝내지 않는다.

**Done:** sitemap의 모든 URL이 사람이 읽을 완성 본문을 가지며, 공식 회사 사실의 코드 owner가 하나이고, production build head에 실험 URL의 홈 canonical이 없다.

### Task 1. theme/glass 실험의 production 소유권을 정리한다

**Files:**

- Modify: `apps/web/app/page.tsx`
- Modify/Delete: `apps/web/components/BottomFloatingThemeSwitcher.tsx`
- Modify/Delete: `apps/web/components/BottomFloatingThemeSwitcherWide.tsx`
- Modify/Delete: 대응 CSS Module과 source test
- Modify: `apps/web/app/globals.css`
- Review: `apps/web/components/glassFilter.ts`, `liquidGlassFilter.ts`, `Header.tsx`

**Steps:**

1. production theme이 제품 기능인지 실험인지 결정한다.
2. 실험이면 홈에서 두 control을 모두 제거한다. 제품이면 승인 variant 하나만 남긴다.
3. 둘을 동시에 유지해야 한다는 요구가 있을 때만 theme owner/effect를 하나로 올리고 view를 controlled component로 바꾼다.
4. 남은 filter consumer를 다시 세고, 가변 filter가 필요하면 cache/SVG node 상한을 둔다. 복잡도가 이득보다 크면 CSS blur fallback을 선택한다.

**Done:** production에서 `html[data-theme]` writer가 하나이고 표시와 실제 값이 일치하며, fixed control이 콘텐츠를 가리지 않고, 반복 resize 후 filter node가 문서화된 상한을 넘지 않는다.

### Task 2. 네트워크 예산을 먼저 줄인다

**Files:**

- Replace: `apps/web/public/banner_video.mp4`
- Create: `apps/web/public/images/banner-poster.webp`
- Modify: `apps/web/components/VideoBanner.tsx`
- Modify: `apps/web/app/page.module.css`, `apps/web/app/contact/page.module.css`
- Move: `apps/web/public/images/s4_bg.png` → `apps/web/public/images/marketing-grid-background.png`
- Delete: `apps/web/public/figma-assets/contact-background.png`

**Steps:**

1. 첫 release 예산으로 hero 영상을 web용으로 다시 encode해 primary source를 5MB 이하로 제한한다.
2. 실제 첫 frame과 맞는 250KB 이하 poster를 제공한다.
3. reduced-motion과 작은 viewport 정책에서는 poster 우선 또는 video 미재생을 검증한다.
4. exact PNG는 의미 중립적인 URL 하나로 통합하고 중복 파일을 삭제한다.

**Done:** 31,182,835-byte 원본이 production에서 요청되지 않고, poster가 decode 전 hero를 채우며, exact PNG 삭제로 4,154,322 bytes가 줄고 두 route가 같은 URL을 재사용한다.

### Task 3. 실제 font 계약을 연결한다

**Files:**

- Modify: `apps/web/app/layout.tsx`
- Modify: `design-system.css`
- Modify: `design.md`
- Delete: `apps/web/app/fonts/GeistVF.woff`, `GeistMonoVF.woff` if unapproved
- Modify: `apps/web/README.md`, `README.md`

**Steps:**

1. Pretendard self-hosting license와 승인 weight/subset을 확인한다.
2. 승인 WOFF2의 500/700 또는 variable font를 `next/font/local`로 RootLayout에 연결한다.
3. 생성 variable을 기존 `--font-sans` 계약에 연결한다.
4. 승인할 수 없다면 디자인 표준 자체를 실제 system font 기준으로 바꾼다.

**Done:** 새 브라우저 프로필에서 intended font와 500/700 resource가 실제 로드되고, 390/640/1080/1440에서 한글 줄바꿈을 재검증했으며 README가 실제 구조를 설명한다.

### Task 4. native route layout과 Client island를 만든다

**Files:**

- Create: `apps/web/app/(marketing)/layout.tsx`
- Create: `apps/web/app/(marketing)/layout.module.css`
- Move: 홈, about, blog, contact, faq, portfolio, service route를 `(marketing)` 아래로 이동
- Create: route-local `BlogPostExplorer.tsx`, `PortfolioFilterGrid.tsx`, `FaqCategoryNav.tsx`, `ContactForm.tsx`
- Modify: 각 route `page.tsx`와 metadata layout

**Steps:**

1. URL을 유지한 채 route group을 만들고 Header/Footer를 layout 한 곳으로 옮긴다.
2. leaf page의 Header/Footer import를 제거한다.
3. FAQ부터 browser API가 필요한 최소 leaf를 추출하고 page의 `"use client"`를 제거한다.
4. 같은 패턴을 portfolio, blog, contact에 반복한다. detail-only data module을 Client leaf에서 import하지 않는다.

**Done:** 11개 leaf page에 Header/Footer가 없고, 네 page가 Server Component이며, JS를 끈 HTML에도 목록·FAQ·form fields가 보이고 기존 상호작용은 유지된다.

### Task 5. canonical domain data를 만든다

**Files:**

- Create: `apps/web/content/faqs.ts`
- Create: `apps/web/content/portfolio.ts`
- Modify: `apps/web/content/company.ts`, `company-proof.ts`
- Modify: 홈/FAQ/서비스/portfolio/About/Footer/JSON-LD consumers

**Steps:**

1. exact 값인 proof metrics부터 stable id owner로 옮긴다.
2. company identity를 화면과 JSON-LD가 함께 사용하게 한다.
3. portfolio를 slug owner 하나와 named presentation fields로 합친다.
4. FAQ 승인 문구를 확정한 뒤 stable id로 선택한다. 목적이 다른 답은 별도 이름을 준다.

**Done:** 같은 사실의 정의가 한 곳이고 각 화면은 명시적인 id/slug selection 또는 projection을 사용하며 배열 위치 `slice`로 콘텐츠를 고르지 않는다.

### Task 6. route-private composition과 정확한 중복 삭제를 한다

**Files:**

- Create: `apps/web/app/(marketing)/_components/home/*` 또는 route와 가장 가까운 private folder
- Modify: 큰 home/About/service page와 CSS Module
- Delete: `apps/web/components/withGlass.tsx`
- Consolidate: blog/portfolio detail CTA
- Review/trim: `apps/web/components/Icon.tsx`, `icons.tsx`, `public/figma-icons`
- Modify: ownership source tests

**Steps:**

1. `HomePortfolioSection` 하나를 markup/CSS 이동만으로 pilot 추출한다.
2. 데이터 모델 변경은 별도 commit으로 분리한다.
3. 책임·독립 스타일·별도 생명주기·독립 변경 주기 중 두 조건 이상인 section만 추가 추출한다.
4. string 기반 icon consumer까지 전부 검색한 뒤 dead registry만 줄인다. Figma source asset 삭제는 별도 결정으로 남긴다.
5. 검사 기준을 literal page 인라인에서 route-private import 경계로 바꾼다.

**Done:** page가 section 순서와 data flow를 설명하고, 한 section 변경이 다른 section CSS를 열게 하지 않으며, consumer 0 production module과 이름만 다른 CTA clone이 없다.

### Task 7. breakpoint와 UI primitive 계약을 문서화하고 좁게 적용한다

**Files:**

- Modify: `design.md`
- Modify: `apps/web/components/ProcessSection.module.css`
- Modify: `apps/web/app/service/mvp/page.module.css`
- Modify: `apps/web/app/service/company-homepage/page.module.css`
- Create: `packages/ui/src/radio.module.css`
- Modify: `packages/ui/src/radio.tsx`, 이후 Checkbox/SearchInput pilot
- Modify: `packages/ui/src/button.tsx`와 반복 CTA consumer

**Steps:**

1. structural/reference-frame/compact/component-fit 역할을 먼저 문서화한다.
2. no-op media block과 설명 없는 1081만 우선 처리한다.
3. Radio의 per-instance `<style>`을 CSS Module로 옮기고 token/typography utility를 사용한다.
4. 반복 CTA geometry는 실제 6개 consumer 계약이 같음을 확인한 뒤 Button size/shape option 하나로 승격한다.
5. raw hex와 typography는 exact token match만 기계적으로 교체한다.

**Done:** 변경한 breakpoint가 역할로 설명되고, base와 같은 media declaration이 없으며, Radio instance마다 style node가 생기지 않고, 동일 CTA geometry owner가 한 곳이다.

### Task 8. 문의·접근성·오류 복구를 완성한다

**Files:**

- Create: 승인된 `apps/web/app/(marketing)/privacy/page.tsx`, `terms/page.tsx`
- Modify: `apps/web/components/Footer.tsx`
- Modify: `apps/web/app/(marketing)/contact/page.tsx`와 form island
- Modify: `apps/web/app/api/contact/route.ts`
- Modify: `apps/web/components/Header.tsx`
- Create: `(marketing)/not-found.tsx`, 필요한 최소 `error.tsx`

**Steps:**

1. 법률 승인된 정책을 실제 Link로 연결한다.
2. 배포 인프라 기준 rate/abuse control을 정하고 Slack fetch에 deadline과 안정된 error mapping을 둔다.
3. Service navigation의 ARIA를 실제 subnav/disclosure pattern과 맞춘다.
4. mobile menu에 Escape, open 시 focus 이동, close 시 trigger focus 복원, active `aria-current`를 추가한다.
5. 잘못된 detail slug와 render error의 복구 동선을 제공한다.

**Done:** 정책을 동의 전에 읽을 수 있고, contact endpoint가 합의된 rate/deadline 안에서 종료되며, keyboard-only로 header와 오류 복구 동선을 사용할 수 있다.

## 단계별 공통 검증

각 task는 최소 다음을 통과해야 한다.

```bash
pnpm --filter web lint
pnpm --filter web check-types
rg --files apps/web packages/ui | rg '\.(test|spec)\.(mjs|ts|tsx|js)$' | xargs node --test
pnpm --filter web build
```

반응형 변경은 다음 너비를 묶어서 확인한다.

- 638 / 639 / 640 / 641
- 766 / 767 / 768 / 769
- 1078 / 1079 / 1080 / 1081 / 1082
- 1438 / 1439 / 1440 / 1441 / 1442

추가 release check:

- production HTML의 canonical/noindex를 `/`, `/color`, `/liquid-glass`, 공개 blog/portfolio detail에서 직접 확인
- sitemap URL 전수에서 placeholder·draft·미래 임시 게시물이 없는지 확인
- Chrome mobile/desktop에서 video waterfall과 남은 glass on/off trace 비교
- keyboard-only로 Header, FAQ hash link, form 정책 link, 404 recovery 확인
- company facts sheet와 화면/JSON-LD diff 확인

## 최종 완료 정의

- production과 sitemap에는 완성되고 승인된 URL만 있다.
- 회사 식별 정보와 수치의 source of truth가 하나다.
- theme writer/control은 승인된 한 owner 아래 일치한다.
- 31.2MB 원본 영상과 4.15MB exact duplicate asset이 production에서 제거된다.
- Pretendard를 실제 로드하거나 디자인 표준을 실제 system font와 맞춘다.
- Header/Footer는 marketing layout 하나, page-level Client는 interaction island만 남는다.
- 중복 FAQ/portfolio/proof/company fact와 exact CSS clone이 제거된다.
- breakpoint는 역할이 설명되고 변경 경계의 -1/0/+1 검증이 남는다.
- 개인정보 정책, abuse control, 접근 가능한 navigation과 오류 복구가 있다.
- 새 runtime dependency나 범용 abstraction은 명확한 필요가 없는 한 추가하지 않는다.

## 루트 리뷰 결론

지금 프로젝트의 가장 큰 장점은 기능을 많이 붙인 것이 아니라, metadata·typed content·route data·native semantics 같은 기본기를 의식하기 시작했다는 점이다. 가장 큰 약점은 같은 기본기가 아직 제품 경계까지 이어지지 않는다는 점이다. “컴포넌트를 줄였다”가 page monolith가 됐고, “theme를 재현했다”가 production 실험과 복수 owner가 됐으며, “SEO를 넣었다”가 미완성 URL까지 더 잘 노출하는 결과가 됐다.

다음 수정의 기준은 더 많은 추상화가 아니다. **공개할 사실을 먼저 확정하고, 전역 owner를 하나로 만들고, 플랫폼이 이미 제공하는 layout/RSC/native CSS를 사용하며, exact duplicate만 증거를 갖고 삭제하는 것**이다. 이 순서를 지키면 코드 양뿐 아니라 변경 영향 범위와 검증 비용이 함께 줄어든다.
