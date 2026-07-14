# Web 재리뷰 — 프론트엔드 성장·유지보수성

## 범위와 결론

- 범위: `apps/web` 및 실제로 `apps/web`이 소비하는 `packages/ui`의 `Button`, `Checkbox`, `Radio`, `SearchInput`
- 제외: `apps/admin`, 전담 테스트 품질 리뷰
- 판정: **첫 번째 구조 정리는 성공했지만, 두 번째 구조화가 필요하다.** 라우트 전용 데이터와 섹션을 공용 `components`에서 걷어낸 것은 좋은 진전이다. 다만 현재는 "공용이 아니면 인라인"으로 치우쳐 페이지와 CSS가 다시 커졌고, 브라우저 상호작용 하나 때문에 네 개 페이지 전체가 Client Component가 됐다. 최신 홈 변경에서는 두 theme control이 같은 전역 attribute를 독립 state로 쓰는 실제 owner 충돌도 생겼다.
- P0: 없음. 지금 바로 장애를 만드는 구조 문제는 확인하지 못했다.
- 가장 먼저 고칠 습관: 코드를 쓰기 전에 `공유 도메인 사실 / 라우트 전용 표현`, `Server / Client`, `구조 전환 / 디자인 프레임 보정`, `공용 / route-private`을 분류한다.

이번 수정은 실패가 아니다. `route ownership`을 의식하기 시작했고 타입 계약도 좋아졌다. 다음 단계는 ownership을 **인라인**이 아니라 **가까운 위치의 작은 소유 단위**로 표현하는 것이다.

## 실제로 좋아진 점

### 1. 라우트 전용 데이터의 위치가 명확해졌다

- 홈 데이터는 `apps/web/app/content.ts:1-270`, 소개 데이터는 `apps/web/app/about/content.ts:1-97`, 서비스 데이터는 각 서비스의 `content.ts`로 이동했다.
- 렌더러가 자체 기본 데이터를 숨겨 갖지 않는다. `apps/web/components/FaqSection.tsx:12-20`은 `items`를 필수로 받고, `apps/web/components/ProofMetrics.tsx:11-15`도 readonly 데이터를 명시적으로 받는다.
- `apps/web/app/faq/content.ts:27-318`은 `as const satisfies`로 FAQ와 아이콘 이름의 타입을 검증한다. 문자열 기반 콘텐츠에서 오타를 컴파일 단계로 끌어온 좋은 습관이다.

### 2. 실제 재사용과 우연한 파일 분리가 구분되기 시작했다

- 세 서비스 라우트가 `ServicePortfolioSection` 하나를 사용하고, `apps/web/components/component-ownership.test.mjs:41-69`가 이 소유 관계를 설명한다.
- 단일 소비자였던 작은 카드 컴포넌트를 무조건 공용 폴더에 남기지 않은 방향은 맞다. `apps/web/components/component-ownership.test.mjs:72-87`의 `ProcessStepCard` 정리는 대표적인 예다.
- CTA 목적지는 `apps/web/components/cta-events.ts:1-20`의 union과 map으로 묶였고, `apps/web/components/BusinessTypesSection.tsx:7-42`에서 `satisfies readonly ServiceCardData[]`로 소비 계약을 확인한다.

### 3. Server Component 기본값을 지킨 라우트가 많다

- 홈, 소개, 세 서비스 페이지는 최상단에 `"use client"`가 없다. `apps/web/app/page.tsx:46`, `apps/web/app/about/page.tsx:34`, `apps/web/app/service/app/page.tsx:33`은 서버에서 조합되고 상호작용이 필요한 하위 컴포넌트만 클라이언트로 내려간다.
- 메타데이터 생성도 `apps/web/app/site-metadata.ts:14-49`로 일관되게 묶였다. 페이지별 title/description은 라우트 가까이에 두면서 canonical/Open Graph 계약을 공유한 구조가 좋다.

### 4. 디자인 시스템을 사용하려는 기본 방향은 자리 잡았다

- CSS Modules 전반에서 전역 typography utility를 `composes`로 사용하는 사례가 많다.
- 그라디언트 stop은 `packages/ui/src/button.tsx:68-102`에 모여 있어 페이지가 직접 그라디언트를 다시 만들지 않는다.
- divider를 실제 DOM으로 렌더링하는 패턴도 `apps/web/components/ProofMetrics.tsx:18-23`, `apps/web/components/FaqSection.tsx:26-41`에서 지켜진다.

## 시작부터 잡았어야 했던 기준

| 먼저 결정할 것 | 기본 규칙                                                                                                             | 현재 코드에서 보이는 결과                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 소유권         | 한 화면 전용이면 해당 라우트의 `_components`; 두 라우트 이상에서 같은 계약으로 쓰일 때만 전역 `components`            | 전역 폴더는 정리됐지만 라우트 페이지가 250~410줄로 커짐                      |
| 데이터 성격    | 사업자 정보·FAQ·포트폴리오·실적은 도메인 사실로 한 곳에, 화면별 문구와 배치는 라우트에                                | `content.ts`는 생겼지만 같은 사실이 여러 route content에 복제됨              |
| 렌더링 경계    | `page.tsx`와 `layout.tsx`는 Server가 기본, hook/DOM/event가 필요한 가장 작은 leaf만 Client                            | 검색·필터·스크롤 내비게이션 때문에 네 페이지 전체가 Client가 됨              |
| 전역 상태      | `documentElement`, storage, site theme 같은 side effect는 writer 1개가 소유하고 control은 그 값을 구독                | 홈의 pill/wide switcher가 독립 state로 같은 `data-theme`을 씀                |
| 글꼴 공급      | type scale을 정할 때 family 이름뿐 아니라 실제 font resource, weight, loading 전략까지 함께 확정                      | Pretendard token은 있으나 font를 로드하지 않아 OS마다 fallback이 달라짐      |
| CSS 계약       | breakpoint 숫자가 아니라 역할을 먼저 정하고, typography/color는 token을 통해 사용                                     | 86개 media query와 639/640, 767/768, 1079/1080/1081 혼용이 남음              |
| 추상화 승격    | 두 번째 실제 소비자가 생길 때 공용화하고, route-private 분리는 책임·독립 스타일·변경 주기 중 두 조건 이상일 때만 한다 | `withGlass`는 소비자 0, 홈 전용 theme switcher 두 variant는 전역 폴더에 있음 |
| 완료 정의      | 같은 사실의 owner 1개, leaf Client, 설명 가능한 breakpoint, 변경 범위가 한 소유 단위에 닫힘                           | 기능은 동작하지만 변경 영향 범위를 사람이 다시 추론해야 하는 부분이 남음     |

## 발견 사항

### [P1] 마케팅 페이지 공통 shell의 소유자가 없다

**근거**

- `apps/web/app/page.tsx:11-12,49-51,411`
- `apps/web/app/about/page.tsx:3-4,36-38,252`
- `apps/web/app/service/app/page.tsx:5-6,35-37,349`
- `apps/web/app/blog/page.tsx:9-10,98-102,175`
- `apps/web/app/blog/layout.tsx:10-13` 등 현재 route layout은 metadata만 제공하고 children을 그대로 반환한다.

11개 공개 페이지가 `Header`, fixed header wrapper, `Footer`를 각자 조립한다. 화면마다 같은 shell을 반복하면 Header 위치, z-index, footer 배치, 테마 적용을 바꿀 때 모든 라우트를 다시 확인해야 한다. App Router의 `layout.tsx`가 해결하도록 설계된 문제다.

**왜 중요한가**

- route composition을 배우는 핵심은 공통 UI를 React wrapper 컴포넌트로 하나 더 만드는 것이 아니라 라우팅 계층의 native ownership으로 올리는 것이다.
- 현재처럼 leaf page가 shell까지 소유하면 페이지 본문과 사이트 chrome의 변경 주기가 섞인다.

**최소 다음 행동**

1. URL을 바꾸지 않는 `apps/web/app/(marketing)/layout.tsx`를 만든다.
2. `/`, `/about`, `/blog`, `/contact`, `/faq`, `/portfolio`, `/service/*`를 route group 아래로 옮긴다.
3. Header와 Footer, fixed header layer CSS는 이 layout 한 곳에서 렌더링한다. `/api`, `/color`, `/liquid-glass`는 제외한다.

**완료 기준**

- marketing leaf `page.tsx`에서 `Header`와 `Footer` import가 0개다.
- 기존 URL과 metadata가 그대로다.
- 390, 640, 1080, 1440px에서 fixed header와 footer 위치가 이전과 같다.

**리팩터링 연습 단위**

- 먼저 `/about`과 `/service/mvp` 두 라우트만 임시 route group에서 검증한 뒤 전체로 넓힌다. 목적은 "공통 컴포넌트 만들기"가 아니라 "라우트 트리가 UI 소유권을 표현하게 만들기"다.

### [P1] Pretendard type scale은 정의됐지만 Pretendard font는 로드되지 않는다

**근거**

- `design.md:3-6`과 `design-system.css:1-2`는 기본 family를 Pretendard로 선언한다.
- `apps/web/app/layout.tsx:1-5`는 global/design-system CSS만 import하며 `next/font`, `localFont`, font stylesheet를 로드하지 않는다. `apps/web/app/globals.css:31-36`도 선언된 `--font-sans`를 사용할 뿐 resource를 공급하지 않는다.
- 저장소 전체에 `@font-face`, `next/font`, `localFont` 사용이 없다. 따라서 Pretendard가 OS에 설치되지 않은 환경에서는 `Apple SD Gothic Neo`, `Noto Sans KR`, generic sans-serif 순으로 달라진다.
- `apps/web/app/fonts/GeistVF.woff`와 `GeistMonoVF.woff`는 각각 66KB, 67KB지만 어느 코드에서도 참조되지 않는다.
- `apps/web/README.md:21`은 실제와 달리 `next/font`로 Inter를 로드한다고 설명한다. root `README.md:19-21`도 이미 삭제된 `docs` 앱과 `web/docs`가 함께 쓰는 stub UI package를 설명한다.

**왜 중요한가**

- typography token은 family resource가 실제로 로드될 때만 같은 디자인을 보장한다. OS별 glyph 폭과 line metric 차이는 줄바꿈, 카드 높이, breakpoint 경계까지 바꾼다.
- 코드, binary, 문서가 서로 다른 font 이야기를 하면 새 개발자는 존재하는 Geist를 써야 하는지, README의 Inter를 복구해야 하는지, Pretendard를 외부에서 가져와야 하는지 추측하게 된다.

**최소 다음 행동**

1. Pretendard의 실제 공급 방식과 라이선스를 먼저 확정한다. self-host가 승인되면 필요한 500/700 또는 variable WOFF2를 `next/font/local`로 로드하고 CSS variable로 `--font-sans`에 연결한다.
2. 외부 CDN을 선택한다면 그 이유, CSP/개인정보/가용성 trade-off, fallback을 문서화한다. 이름만 선언한 현재 상태는 유지하지 않는다.
3. Geist를 쓸 제품 계획이 없다면 두 미사용 binary를 삭제한다. Pretendard와 Geist를 둘 다 막연히 보관하지 않는다.
4. `apps/web/README.md`와 root `README.md`를 현재 pnpm 명령, 실제 app/package 구성, 실제 font 전략으로 갱신한다.

**완료 기준**

- 새 브라우저 프로필의 Network/Fonts 또는 `document.fonts`에서 Pretendard가 실제 로드되고, computed font가 fallback이 아니다.
- 500/700 weight가 합성되지 않고 의도한 resource로 표시된다.
- 한글 제목의 줄바꿈을 390, 640, 1080, 1440px에서 다시 확인한다.
- 참조되지 않는 Geist binary가 없고 README에 Inter/삭제된 `docs` 앱 설명이 없다.

**리팩터링 연습 단위**

- 먼저 별도 branch에서 root layout에 font 한 종류와 두 weight만 연결하고, 홈 hero/FAQ/Portfolio 카드의 줄바꿈 전후를 비교한다. font loader abstraction이나 여러 family 지원을 함께 만들지 않는다.

### [P1] 상호작용 한 조각 때문에 페이지 전체가 Client Component다

**근거**

- `apps/web/app/faq/page.tsx:1,19-185`: 스크롤 내비게이션 때문에 FAQ hero와 모든 FAQ 내용까지 Client 경계 안에 있다.
- `apps/web/app/portfolio/page.tsx:1,19-24`: category state 하나 때문에 featured case와 전체 페이지가 Client다.
- `apps/web/app/blog/page.tsx:1,81-96`: 검색 state 하나 때문에 hero, featured post, 카드 전체가 Client다.
- `apps/web/app/contact/page.tsx:1,86-135`: form state/formatting 때문에 Header, 제목, Footer까지 Client다.
- 동일 앱의 유일한 contact mutation 소비자는 `apps/web/app/contact/page.tsx:110-117`이며, `apps/web/app/api/contact/route.ts:114-160`을 호출한다.

**왜 중요한가**

- Server/Client 판단은 "페이지에 hook이 있는가"가 아니라 "hook이 필요한 최소 DOM 경계가 어디인가"로 해야 한다.
- 지금 구조는 정적 콘텐츠도 hydration 대상에 포함시키고, 이후 server-only 데이터 접근이나 route-level async 렌더링을 추가하기 어렵게 만든다.
- 현재 Route Handler 구조는 유효하며 이 리뷰의 기본 변경안은 아니다. 외부 클라이언트용 API 계약이 없다는 제품 결정이 별도로 내려진 경우에만, Server Action을 내부 mutation의 대안으로 비교해 보는 학습 과제가 될 수 있다.

**최소 다음 행동**

1. `FaqCategoryNav`, `PortfolioFilterGrid`, `BlogPostExplorer`, `ContactForm`만 각각 route-private Client Component로 분리한다.
2. 네 `page.tsx`의 `"use client"`를 제거하고, plain readonly object/array만 Client leaf에 전달한다.
3. `/api/contact`는 현재 과제에서 유지한다. 추후 외부 API 계약이 없다고 제품 차원에서 결정됐을 때만 별도 실험 branch에서 `useActionState`/Server Action을 비교한다.

**완료 기준**

- 네 `page.tsx` 모두 Server Component다.
- 브라우저 API, hook, event handler는 `_components/*Client.tsx` 또는 상호작용 leaf에만 있다.
- Server에서 Client로 넘기는 props가 string/number/boolean/plain object/array로만 구성된다.
- 검색, 필터, FAQ active state, 문의 성공·실패 상태의 동작은 유지된다.

**리팩터링 연습 단위**

- FAQ부터 한다. `CategoryNav`는 이미 `apps/web/app/faq/page.tsx:19-185`에 경계가 선명하다. 이 한 컴포넌트를 떼고 page의 `"use client"`를 없애는 작업이 RSC 경계를 익히기에 가장 작고 명확하다.

### [P1] route content는 생겼지만 도메인 사실의 canonical owner는 아직 없다

**근거**

- 공통 FAQ 7개가 `apps/web/app/content.ts:234-270`과 `apps/web/app/faq/content.ts:27-63`에 동일하게 존재한다.
- MVP FAQ 5개가 `apps/web/app/service/mvp/content.ts:84-110`과 `apps/web/app/faq/content.ts:177-203`에 동일하게 존재한다.
- 앱 FAQ는 `apps/web/app/service/app/content.ts:138-169`와 `apps/web/app/faq/content.ts:205-231`에서 같은 질문에 답변 길이가 달라졌고, 기업 홈페이지 FAQ도 `apps/web/app/service/company-homepage/content.ts:68-99`와 `apps/web/app/faq/content.ts:233-259`에서 이미 drift가 생겼다.
- 포트폴리오의 같은 프로젝트가 `apps/web/app/content.ts:168-205`, `apps/web/app/portfolio/portfolio-items.ts:11-168`, `apps/web/components/ServicePortfolioSection.tsx:9-28`에 세 벌로 존재한다.
- proof metric은 `apps/web/app/content.ts:24-45`, `apps/web/app/about/content.ts:55-76`, `apps/web/app/portfolio/portfolio-items.ts:1-5`에서 반복된다.
- 회사 정보는 `apps/web/app/about/content.ts:78-97`, `apps/web/components/Footer.tsx:7-10,39-64`, `apps/web/app/organization-json-ld.json:5-34`에 분산된다. About의 `전화`는 `02-1234-5678`, Footer의 `전화번호`는 `010-3242-8118`인데 사무실/고객센터 차이가 명시되지 않았다.

**왜 중요한가**

- ownership은 "사용하는 화면 옆에 복사"가 아니라 "같은 사실이 바뀔 때 고칠 곳이 하나"라는 뜻이다.
- route copy와 domain fact를 구분하지 않으면 콘텐츠 수정이 코드 리팩터링이 되고, SEO/JSON-LD와 화면 정보가 서로 달라질 수 있다.

**최소 다음 행동**

1. `apps/web/content/faqs.ts`, `portfolio.ts`, `company.ts`, `company-proof.ts`를 domain owner로 둔다.
2. FAQ와 portfolio에는 안정적인 `id`/`slug`를 두고, 각 화면은 필요한 id를 명시적으로 선택한다. 배열 위치에 의존한 `slice`는 사용하지 않는다.
3. 현재 길이가 다른 FAQ 답변은 먼저 어떤 문구가 승인본인지 결정한다. 실제로 서로 다른 목적이면 별도 entry로 명명하고, 단지 복사 후 수정된 것이라면 canonical 하나로 합친다.
4. 카드용 짧은 설명과 상세 페이지 제목처럼 의도적으로 다른 presentation copy는 억지로 하나로 만들지 않는다.
5. 회사 전화는 office/support의 의미를 확인한 뒤 필드명을 분리한다. map query는 표시 주소와 별도 필드로 유지한다.

**완료 기준**

- 하나의 FAQ 질문/답변, portfolio slug, proof metric, 회사 식별 정보는 canonical 정의가 정확히 1개다.
- 홈·서비스·목록·상세·Footer·JSON-LD는 id 선택 또는 projection으로 같은 owner를 사용한다.
- 승인된 화면별 표현 차이는 이름이 붙은 필드로만 남고, 우연한 복제는 없다.

**리팩터링 연습 단위**

- `proof metrics`부터 시작한다. 구조가 단순하고 정확히 같은 값이므로 한 파일로 옮기고 홈/About/Portfolio가 id로 고르는 연습을 한 뒤 FAQ로 확장한다.

### [P2] route ownership을 page 인라인과 동일하게 해석해 composition이 무너졌다

**근거**

- `apps/web/app/page.tsx:47-414`은 368줄짜리 render body이고, 대응 CSS `apps/web/app/page.module.css:32-817`에는 홈 여러 섹션의 selector가 한 파일에 이어진다.
- `apps/web/app/about/page.tsx:34-255`와 `apps/web/app/about/page.module.css:1-321`도 동일한 형태다.
- `apps/web/app/service/app/page.tsx:33-352`와 `apps/web/app/service/app/page.module.css:1-445`는 한 서비스 라우트 안의 서로 다른 섹션 변경 주기를 한 파일에 묶는다.
- `apps/web/app/page.test.mjs:72-130`은 node id가 literal `page.tsx` 안에 있는지 확인하고 test 이름으로 home-only markup의 인라인을 요구한다. `apps/web/app/about/page.test.mjs:27-53,84-125`, `apps/web/app/service/app/page.test.mjs:31-53,76-98`도 같은 구조를 고정한다.
- `apps/web/components/component-ownership.test.mjs:17-38,72-87`이 지키려 한 "단일 라우트 구현을 전역 components에 두지 않는다"는 의도는 맞지만, guardrail이 route-private component까지 구분하지 못해 결과적으로 page monolith를 보호한다.

**왜 중요한가**

- route-private component와 global shared component는 다르다. 재사용되지 않더라도 이름 있는 section은 page가 화면 순서를 설명하게 하고, 해당 CSS 변경을 그 section에 닫아준다.
- 거대한 page와 CSS는 코드를 줄인 것이 아니라 탐색 비용을 한 파일로 압축한 것이다. 특히 selector 충돌을 피하려고 긴 접두사를 쓰기 시작하면 소유권 경계가 사라졌다는 신호다.
- 반대로 파일이 길다는 이유만으로 모든 `div`, 카드, 작은 helper를 컴포넌트로 떼면 탐색 비용만 다시 늘어난다. route-private 분리는 아래 네 신호 중 최소 두 개가 있을 때만 한다.
  - 사용자가 인식할 수 있는 명확한 section 책임과 이름이 있다.
  - 독립 CSS Module 또는 독자 breakpoint/visual contract가 있다.
  - 데이터나 상호작용 생명주기가 주변과 다르다.
  - 다른 section과 별도로 변경·리뷰되는 변경 주기를 가진다.

**최소 다음 행동**

1. `apps/web/app/_components/home/` 또는 URL에 영향을 주지 않는 route-private 폴더에 `HomeListeningSection`, `HomeProofSection`, `HomeScopeSection`, `HomePortfolioSection`, `HomeInsightsSection`을 둔다.
2. 각 section이 자기 CSS Module을 소유하게 한다.
3. 이 컴포넌트들을 전역 `apps/web/components`로 되돌리지 않는다. 두 번째 실제 라우트 소비자가 생길 때만 공용화를 검토한다.
4. 단일 wrapper, 반복되지 않는 10여 줄 markup, 독립 스타일이 없는 작은 leaf는 page나 부모 section 안에 남긴다.
5. ownership guardrail은 "markup이 반드시 page 파일에 있다"가 아니라 "route-private module을 다른 route가 import하지 않는다"와 "전역 승격에 실제 다중 소비자/primitive 근거가 있다"를 검사하게 바꾼다. DOM/visual contract 검사는 파일 위치와 분리한다.

**완료 기준**

- `Home`의 JSX가 페이지 section 순서를 위에서 아래로 읽을 수 있는 composition이 된다.
- 한 홈 section의 markup/style 변경에 다른 section의 파일을 열 필요가 없다.
- route-private 컴포넌트는 다른 route에서 import되지 않는다.
- 전역 `components`는 실제 다중 route 소비자 또는 명확한 UI primitive만 가진다.
- 목표 LOC 숫자는 두지 않는다. 추출한 각 파일은 위 네 신호 중 최소 두 개로 존재 이유를 설명할 수 있다.
- 구조 검사가 route-private extraction을 허용하면서도 cross-route import와 무근거 global promotion은 실패시킨다.

**리팩터링 연습 단위**

- `HomePortfolioSection` 하나만 먼저 분리한다. 데이터 canonical 작업과 섞지 말고 DOM/CSS 이동만 해서 "소유권 이동"과 "데이터 모델 변경"을 한 번에 하지 않는 연습을 한다.

### [P2] breakpoint와 typography 규칙이 문서에만 일부 있고 자동으로 지켜지지 않는다

**근거**

- 현재 CSS Modules에는 86개의 media query가 있고 1079/1080/1081 계열 19개, 639/640 계열 16개, 767/768 계열 17개가 섞여 있다.
- `apps/web/app/service/mvp/page.module.css:202-206`의 유일한 `max-width: 1081px`에는 예외 이유가 없다.
- `apps/web/components/ProcessSection.module.css:101-106`의 base `gap: 16px`를 `apps/web/components/ProcessSection.module.css:212-216` media query가 그대로 반복한다.
- `design.md:56-58`은 typography/color 규칙을 명확히 말하지만 breakpoint 역할은 정의하지 않는다.
- `apps/web/app/service/company-homepage/page.module.css:43-60`은 정확히 존재하는 `pretendard-bold-18`, `pretendard-medium-14`를 compose하지 않고 font 속성을 다시 쓴다.

**왜 중요한가**

- 639와 640을 모두 쓰는 것 자체가 버그는 아니다. 문제는 하나가 구조 전환인지, 하나가 640px Figma frame 보정인지 코드와 문서로 구분되지 않는 것이다.
- 규칙을 기억에 의존하면 새 화면을 만들 때마다 같은 논쟁과 회귀가 반복된다. 디자인 시스템은 token 목록이 아니라 선택 기준과 검사 기준까지 포함해야 한다.

**최소 다음 행동**

1. `design.md`에 네 역할을 기록한다.
   - 구조 전환: small `max-width: 639px`, medium `640-1079px`, desktop `min-width: 1080px`
   - reference-frame 보정: `max-width: 640px`, `max-width: 1080px`; spacing/size 조정에만 사용
   - section compact: 기존 `SectionShell` 계약인 `max-width: 768px`
   - component-fit: 1023, 900, 720, 560, 1439/1440처럼 실제 내용이 깨지는 값은 해당 컴포넌트 로컬에 유지
2. `ProcessSection`의 무효 media block을 삭제한다.
3. MVP의 1081을 1080에서 검증하고 의도한 값으로 통일하거나 이유를 주석/문서에 남긴다.
4. company homepage typography를 기존 utility compose로 바꾼다.
5. 새 dependency 없이 현재 source-check 방식으로 "비반응형 raw typography"와 "base와 동일한 media declaration"을 검사한다.

**완료 기준**

- 설명 없는 1081 breakpoint가 0개다.
- reference-frame query에는 간격/크기만, structural query에는 column/stack/display 전환만 있다.
- base와 같은 선언만 가진 media query가 0개다.
- 전역 typography utility compose나 문서화된 중앙 component contract 없이 비반응형 CSS Module에 직접 쓴 `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`이 0개다.
- 변경한 경계마다 `-1 / 경계 / +1` 너비에서 레이아웃 회귀가 없다.

**리팩터링 연습 단위**

- `service/mvp/page.module.css` 하나만 breakpoint 역할별로 분류표를 만든다. 숫자를 일괄 치환하지 말고 각 rule을 "구조 / frame / compact / fit" 중 하나로 설명할 수 있을 때만 바꾼다.

### [P2] 실제 소비되는 UI primitive가 디자인 시스템의 enforcement point가 되지 못한다

**근거**

- `packages/ui/src/radio.tsx:18-55`는 layout, typography, color를 inline object로 다시 정의하고, `packages/ui/src/radio.tsx:57-81,124`는 같은 CSS `<style>`을 인스턴스마다 렌더링한다.
- 문의 페이지는 `apps/web/app/contact/page.tsx:218-227`에서 Radio 세 개를 렌더링하므로 같은 style text도 세 번 생성된다.
- `packages/ui/src/search-input.tsx:17-47`과 `packages/ui/src/checkbox.tsx:64-88,167-178`도 palette에 이미 있는 색과 typography를 raw inline 값으로 복제한다.
- 반면 `packages/ui/src/button.tsx:68-102`는 gradient variant의 소유권을 한곳에 둔 좋은 선례다.

**왜 중요한가**

- shared UI는 각 페이지가 규칙을 지키도록 만드는 가장 강한 경계여야 한다. 지금은 앱 CSS가 token을 잘 써도 primitive 내부에서 다시 raw 값으로 돌아간다.
- inline style 중심 구조는 hover/focus/disabled/responsive contract를 확장할수록 문자열 CSS와 조건부 object가 늘어난다.

**최소 다음 행동**

1. 실제 사용 중인 `Radio` 하나를 pilot으로 `radio.module.css`로 옮긴다.
2. typography는 global utility compose, exact palette color는 `var(--color-...)`를 사용한다.
3. checked/disabled sibling selector도 module에 두고 인스턴스 내부 `<style>`을 제거한다.
4. 그 패턴이 안정되면 Checkbox와 SearchInput에 반복 적용한다. 동적 width처럼 실제로 런타임 값인 것만 style prop으로 남긴다.

**완료 기준**

- Radio 렌더 결과에 컴포넌트별 `<style>` node가 없다.
- 실제 소비되는 UI primitive 안에 palette와 정확히 같은 raw hex가 없다.
- typography scale 변경은 `design-system.css` 한곳의 수정으로 primitive에 전파된다.
- disabled, checked, focus-visible 상태의 시각/접근성 동작이 유지된다.

**리팩터링 연습 단위**

- Contact의 Radio 세 개만 전/후 DOM과 computed style을 비교한다. UI package 전체를 한 번에 재작성하지 않는다.

### [P1] 전역 theme state를 두 컴포넌트가 독립적으로 소유한다

**근거**

- 홈은 `apps/web/app/page.tsx:6-7,53-56`에서 pill과 wide theme switcher를 동시에 렌더한다.
- `apps/web/components/BottomFloatingThemeSwitcher.tsx:23-46`과 `apps/web/components/BottomFloatingThemeSwitcherWide.tsx:28-78`은 각각 독립 `theme` state를 만들고, 둘 다 `document.documentElement.dataset.theme`를 쓰고 cleanup에서 삭제한다.
- 같은 세 option도 `BottomFloatingThemeSwitcher.tsx:14-18`과 `BottomFloatingThemeSwitcherWide.tsx:12-16`에 복제되어 있다.

**왜 중요한가**

- 한 control에서 dark를 선택해도 다른 control의 checked state는 light에 남는다. 이후 어느 control을 조작하느냐에 따라 마지막 write가 전역 theme를 결정한다.
- 전역 상태는 writer가 하나여야 한다. 같은 DOM attribute를 두 effect가 소유하면 UI 표시, 실제 theme, cleanup 생명주기가 서로 drift한다.

**최소 다음 행동**

1. 두 variant가 실험 비교용이면 하나를 선택하고 다른 variant와 대응 CSS를 삭제한다. 현재 요구에는 이것이 가장 단순한 해법이다.
2. 두 control이 동시에 필요한 제품 요구가 확인된 경우에만 공통 상위 owner가 `theme`과 `documentElement` effect를 한 번 소유하게 한다. 두 switcher는 controlled `value/onChange` presentation이 되고 option model도 한곳에서 받는다.

**완료 기준**

- `document.documentElement.dataset.theme`를 쓰고 지우는 production owner가 정확히 1개다.
- 화면에 theme control이 둘 이상 있어도 모두 같은 checked value를 즉시 표시한다.
- theme option/type 정의가 한곳에 있고 마지막 writer 경쟁이 없다.

**리팩터링 연습 단위**

- 먼저 wide/pill 중 하나를 삭제하는 결정을 한다. 실제 두 번째 요구가 생기기 전에 context/store/hook을 만들지 않는 것이 이 문제의 핵심 연습이다.

### [P3] 두 번째 소비자 전에 만든 추상화와 전역 배치가 남아 있다

**근거**

- `apps/web/components/withGlass.tsx:33-58`의 HOC는 저장소 전체에서 import하는 소비자가 0개다. 실제 glass 사용은 `GlassSurface`를 직접 사용한다.
- variant 하나를 고른 뒤에도 남는 theme switcher는 홈 한 라우트 전용이지만 전역 `components`에 있다.
- 반대로 실험용 `apps/web/app/liquid-glass/LiquidGlassSwitcher.tsx:14-104`는 라우트 가까이에 있어 ownership이 명확하다.

**왜 중요한가**

- 프론트엔드 성장에서 중요한 판단은 "재사용할 수 있는가"보다 "지금 같은 변경 주기를 가진 두 소비자가 있는가"다.
- 소비자 0인 abstraction은 API 표면만 늘리고, 소비자 1인 전역 컴포넌트는 실제 소유자를 숨긴다.

**최소 다음 행동**

1. `withGlass.tsx`는 삭제한다. 미래 사용 가능성만으로 유지하지 않는다.
2. 선택한 theme switcher가 홈 실험이면 route-private 위치로 옮긴다. 사이트 전체 기능이면 먼저 marketing layout과 theme persistence/FOUC 계약을 정의한 뒤 layout 소유로 승격한다.

**완료 기준**

- import 0인 production component/export가 없다.
- 전역 component마다 다중 route 소비자 또는 foundational primitive라는 이유를 한 문장으로 설명할 수 있다.
- 실험 UI와 production UI의 소유 경계가 폴더 구조로 보인다.

**리팩터링 연습 단위**

- `withGlass.tsx` 한 파일을 삭제하고 import 검색과 type check로 영향이 0임을 확인한다. 이 작업에 새로운 glass abstraction을 만들지 않는다.

## 우선순위별 학습 로드맵

### 1단계 — 디자인 token과 runtime resource를 일치시키기

1. Pretendard loading 방식과 라이선스를 확정한다.
2. root layout에 실제 font resource와 500/700 weight만 연결한다.
3. 미사용 Geist를 지우고 README를 현재 구조에 맞춘다.

**학습 완료 신호:** CSS에 font family 이름을 쓰는 것을 font 적용 완료로 보지 않고, Network/Fonts와 computed style로 resource·weight·fallback을 확인한다.

### 2단계 — Server-first 사고를 몸에 익히기

1. FAQ의 `CategoryNav`만 Client island로 분리한다.
2. Portfolio의 filter grid, Blog의 search/list, Contact의 form으로 같은 패턴을 반복한다.
3. 매번 "이 prop은 직렬화 가능한가?", "이 부모가 정말 browser API를 쓰는가?"를 리뷰 체크리스트로 묻는다.

**학습 완료 신호:** `"use client"`를 기능 파일 최상단에 습관적으로 붙이지 않고, 먼저 경계 그림을 그릴 수 있다.

### 3단계 — App Router를 UI composition 도구로 사용하기

1. `(marketing)/layout.tsx`에 사이트 chrome을 올린다.
2. leaf page는 콘텐츠 section만 반환하게 한다.
3. loading/error/not-found가 필요한 범위도 route tree 기준으로 판단한다.

**학습 완료 신호:** 공용 wrapper 컴포넌트를 만들기 전에 layout/route group으로 해결할 수 있는지 먼저 확인한다.

### 4단계 — route copy와 domain fact를 분리하기

1. proof metric을 canonical owner로 옮긴다.
2. company identity를 Footer/About/JSON-LD가 함께 쓰게 한다.
3. portfolio를 stable slug record로 합친다.
4. 마지막으로 FAQ 승인본을 정리해 id 선택 방식으로 바꾼다.

**학습 완료 신호:** "이 문장은 이 화면의 표현인가, 회사 전체의 사실인가?"에 답한 뒤 파일 위치를 정한다.

### 5단계 — route-private composition을 익히기

1. HomePortfolio 하나를 `_components/home`으로 분리한다.
2. DOM/CSS 이동과 데이터 모델 변경을 다른 작업으로 나눈다.
3. section 책임·독립 style·별도 data/interaction·독립 변경 주기 중 두 조건 이상인지 확인한다.
4. 두 번째 실제 소비자가 생길 때만 전역으로 승격한다.

**학습 완료 신호:** 짧은 파일 수를 늘리는 것이 아니라 section 순서와 데이터 흐름을 설명하는 page를 만들고, 독립 변경 주기가 있는 세부 markup만 소유 단위 안에 닫는다.

### 6단계 — 디자인 시스템을 기억이 아니라 guardrail로 만들기

1. breakpoint 역할을 `design.md`에 추가한다.
2. MVP CSS 하나로 경계 분류 연습을 한다.
3. Radio를 CSS Module/token 기반 primitive로 바꾼다.
4. 같은 위반을 잡는 가벼운 source check를 추가한다.

**학습 완료 신호:** 새 CSS를 쓰기 전에 token과 breakpoint 역할을 고르고, 리뷰어가 숫자의 의도를 추측하지 않아도 된다.

## CTO 멘토 결론

현재 코드에서 가장 긍정적인 변화는 **소유권을 의식하기 시작했다는 것**이다. route data, readonly props, typed CTA, metadata helper는 분명 이전보다 성숙한 선택이다.

다음 성장 포인트는 더 많은 패턴이나 더 큰 추상화를 배우는 것이 아니다. 아래 여섯 가지 확인을 구현 전에 습관화하는 것이다.

1. 같은 사실인가, 비슷해 보이는 화면 문구인가.
2. 서버에서 끝낼 수 있는가, 브라우저가 꼭 필요한 가장 작은 부분은 어디인가.
3. 한 라우트 전용인가, 실제로 같은 계약을 가진 두 소비자가 있는가.
4. breakpoint가 구조를 바꾸는가, 특정 디자인 frame의 spacing만 보정하는가.
5. token 이름만 선언했는가, 실제 font/asset/runtime resource까지 공급하고 검증했는가.
6. 전역 side effect를 쓰는 owner가 하나인가, 여러 control이 각자 전역 상태를 덮어쓰는가.

이 확인을 먼저 하면 현재 남은 중복, page monolith, 넓은 Client 경계, font fallback, breakpoint 혼란이 각각 별도 문제가 아니라 같은 설계 습관에서 나온 것임을 볼 수 있다. 다음 리팩터링은 font 한 종류 연결이나 FAQ Client island 하나처럼 작은 단위로 시작하고, 한 번에 ownership·데이터·스타일을 모두 바꾸지 않는 것이 가장 좋은 학습 순서다.
