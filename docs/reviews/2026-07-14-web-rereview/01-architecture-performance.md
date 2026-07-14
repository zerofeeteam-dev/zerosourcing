# Web 재리뷰 — 프론트엔드 아키텍처 / App Router / RSC / 성능

- 리뷰 일자: 2026-07-14
- 범위: `apps/web`와 실제로 `apps/web`에서 소비하는 `packages/ui` 코드만 검토 (`apps/admin` 제외)
- 제외: 전담 테스트 품질 리뷰, 제품 코드 수정
- 기준: App Router 기본 기능 우선, Server Component 기본값 유지, 상호작용만 Client Component로 격리, 새 의존성·새 범용 추상화보다 삭제와 플랫폼 기능 우선
- 근거: 현재 체크아웃의 정적 코드, import/consumer 추적, production build 결과. 실서비스 RUM, 브라우저 Performance trace, CDN 응답 헤더는 확인하지 않았으므로 그 영역의 성능 개선 폭은 단정하지 않는다.

## CTO 결론

현재 구조는 **빌드 가능하고 정적 생성이 잘 작동하는 App Router 사이트**다. 홈·회사소개·서비스·상세 페이지는 Server Component를 기본으로 유지했고, 블로그/포트폴리오 상세는 `generateStaticParams`와 `generateMetadata`를 사용한다. `pnpm --filter web build`도 성공했으며 `/api/contact` 외 공개 페이지는 Static 또는 SSG로 출력됐다. 이전보다 배포 예측 가능성과 검색 메타데이터 구조는 분명히 좋아졌다.

그러나 아직 “프론트엔드 아키텍처가 정리됐다”고 보기는 어렵다. 가장 큰 문제는 다음 세 가지다.

1. 작은 검색·필터·스크롤 상호작용 때문에 블로그, 포트폴리오, FAQ, 문의 페이지 전체가 Client Component다.
2. 동일한 Header/Footer 셸을 11개 마케팅 페이지가 각자 소유해 라우트 이동 때 Header의 무거운 glass 런타임까지 다시 경계 안으로 들어간다.
3. 31,182,835바이트 자동재생 영상과 동일 내용의 4,154,322바이트 PNG 두 개가 코드 구조 개선보다 더 직접적인 네트워크 비용을 만든다.

이 리뷰 범위에서 즉시 서비스 장애나 데이터 손실로 볼 **P0는 발견하지 않았다**. 먼저 P1 여섯 건을 처리하고, P2는 그 다음 묶음으로 진행하는 것이 맞다.

## 확인한 개선점

- [`apps/web/app/page.tsx:1`](../../../apps/web/app/page.tsx#L1), [`apps/web/app/about/page.tsx:1`](../../../apps/web/app/about/page.tsx#L1), [`apps/web/app/service/app/page.tsx:1`](../../../apps/web/app/service/app/page.tsx#L1)은 페이지 전체에 `"use client"`를 선언하지 않는다. 정적 마케팅 콘텐츠를 서버에서 렌더하는 방향이 맞다.
- [`apps/web/app/blog/[slug]/page.tsx:19`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L19)과 [`apps/web/app/portfolio/[slug]/page.tsx:16`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L16)은 데이터에서 상세 경로를 정적으로 생성한다. 같은 파일의 [`blog/[slug]/page.tsx:23`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L23), [`portfolio/[slug]/page.tsx:20`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L20)은 상세 metadata도 데이터에서 만든다.
- [`apps/web/app/site-metadata.ts:14`](../../../apps/web/app/site-metadata.ts#L14), [`apps/web/app/robots.ts:5`](../../../apps/web/app/robots.ts#L5), [`apps/web/app/sitemap.ts:19`](../../../apps/web/app/sitemap.ts#L19)은 App Router의 native metadata API를 사용한다. 별도 SEO 런타임이나 의존성을 추가하지 않은 점이 좋다.
- [`apps/web/app/layout.tsx:22`](../../../apps/web/app/layout.tsx#L22)는 JSON-LD 문자열의 `<`를 escape한 뒤 서버 레이아웃에서 출력한다. 브라우저 효과로 옮길 이유가 없다.
- [`apps/web/app/about/page.tsx:206`](../../../apps/web/app/about/page.tsx#L206)의 지도 iframe은 `loading="lazy"`이고, key가 없을 때 fallback도 존재한다.
- [`apps/web/app/api/contact/route.ts:53`](../../../apps/web/app/api/contact/route.ts#L53)은 서버에서 payload를 다시 파싱·검증하고, [`route.ts:150`](../../../apps/web/app/api/contact/route.ts#L150)은 Slack의 HTTP 성공 여부뿐 아니라 응답의 `ok`도 검사한다. 브라우저 검증만 믿지 않는 방향이 맞다.
- 최근 추가된 glass 처리도 방어 코드는 갖췄다. [`apps/web/components/Header.tsx:45`](../../../apps/web/components/Header.tsx#L45)은 stale async 결과를 token으로 무시하고 observer/timer를 정리하며, [`apps/web/components/liquidGlassFilter.ts:42`](../../../apps/web/components/liquidGlassFilter.ts#L42)와 [`liquidGlassFilter.ts:180`](../../../apps/web/components/liquidGlassFilter.ts#L180)은 동일 geometry 작업을 cache한다.

## 빌드 기준선

- 실행: `pnpm --filter web build`
- 결과: compile, TypeScript, static generation 성공
- 렌더 유형: `/api/contact`만 Dynamic, 나머지 사용자 페이지는 Static 또는 SSG
- 아래 자산 수치는 파일 자체의 정확한 byte 크기다. 실제 전송량은 CDN, range request, 압축, 브라우저 cache에 따라 달라질 수 있다.
  - `apps/web/public/banner_video.mp4`: 31,182,835 bytes
  - `apps/web/public/figma-assets/contact-background.png`: 4,154,322 bytes
  - `apps/web/public/images/s4_bg.png`: 4,154,322 bytes
  - 두 PNG의 SHA-256은 모두 `b8658c2441a57b5aa43ea22c753453a5a274428ef30645cebbe173b9f66a0400`이다.

## 남은 문제

### P1-1. 마케팅 공통 셸이 페이지 11곳에 반복되어 Header가 라우트마다 다시 경계화된다

- 근거:
  - [`apps/web/app/page.tsx:50`](../../../apps/web/app/page.tsx#L50), [`apps/web/app/page.tsx:411`](../../../apps/web/app/page.tsx#L411)
  - [`apps/web/app/about/page.tsx:36`](../../../apps/web/app/about/page.tsx#L36), [`apps/web/app/about/page.tsx:252`](../../../apps/web/app/about/page.tsx#L252)
  - [`apps/web/app/blog/page.tsx:99`](../../../apps/web/app/blog/page.tsx#L99), [`apps/web/app/blog/page.tsx:175`](../../../apps/web/app/blog/page.tsx#L175)
  - [`apps/web/app/portfolio/[slug]/page.tsx:46`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L46), [`apps/web/app/portfolio/[slug]/page.tsx:124`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L124)
  - 같은 패턴이 contact, FAQ, portfolio index, service 3개 페이지에도 있다.
- 관찰: 각 페이지가 `Header` import, fixed header layer, `Footer` import/render를 직접 소유한다. `Header`는 [`apps/web/components/Header.tsx:41`](../../../apps/web/components/Header.tsx#L41)에서 layout effect, `ResizeObserver`, canvas 기반 liquid-glass filter 생성 경로까지 가진 Client Component다.
- 사용자 영향: 내부 라우트 이동 시 공통 navigation DOM과 effect가 페이지 segment와 함께 재평가·재마운트된다. 특히 Header의 observer/filter effect 생명주기가 page segment 생명주기에 묶인다.
- 유지보수 영향: header offset, stacking context, footer 순서 변경을 여러 페이지에서 함께 맞춰야 한다. 새 공개 페이지가 셸을 누락하기도 쉽다.
- 최소 수정안: wrapper 컴포넌트를 새로 만들지 말고 Next route group인 `apps/web/app/(marketing)/layout.tsx` 한 곳에서 `Header`, 공통 header layer, `{children}`, `Footer`를 렌더한다. URL은 바꾸지 않은 채 홈/about/blog/contact/faq/portfolio/service를 route group 아래로 이동한다. `/api`, `/color`, `/liquid-glass`, metadata route는 공통 셸 밖에 둔다.
- 완료 조건:
  - 마케팅 `page.tsx` 안의 `<Header />`, `<Footer />`가 0개다.
  - 기존 공개 URL과 metadata가 바뀌지 않는다.
  - client navigation 전후에 같은 Header DOM이 유지되고 glass observer가 불필요하게 재등록되지 않는다.
  - production build의 route별 client asset을 전후 비교해 변화는 기록하되, route layout만으로 특정 chunk 감소를 완료 조건으로 보장하지 않는다.

### P1-2. 검색·필터·스크롤 때문에 네 페이지 전체가 Client Component다

- 근거:
  - [`apps/web/app/blog/page.tsx:1`](../../../apps/web/app/blog/page.tsx#L1), [`blog/page.tsx:81`](../../../apps/web/app/blog/page.tsx#L81)
  - [`apps/web/app/portfolio/page.tsx:1`](../../../apps/web/app/portfolio/page.tsx#L1), [`portfolio/page.tsx:19`](../../../apps/web/app/portfolio/page.tsx#L19)
  - [`apps/web/app/faq/page.tsx:1`](../../../apps/web/app/faq/page.tsx#L1), [`faq/page.tsx:187`](../../../apps/web/app/faq/page.tsx#L187)
  - [`apps/web/app/contact/page.tsx:1`](../../../apps/web/app/contact/page.tsx#L1), [`contact/page.tsx:86`](../../../apps/web/app/contact/page.tsx#L86)
- 관찰:
  - 블로그는 query state 하나 때문에 hero, featured card, top posts, Header/Footer까지 client graph에 들어간다. 더구나 [`apps/web/app/blog/page.tsx:11`](../../../apps/web/app/blog/page.tsx#L11)이 detail-only `contentHtml`, `relatedSlugs`까지 가진 [`blog-posts.ts:1`](../../../apps/web/app/blog/blog-posts.ts#L1) 모듈을 client에서 import한다.
  - 포트폴리오는 category state 하나 때문에 전체 페이지와 상세용 데이터가 있는 [`portfolio-items.ts:77`](../../../apps/web/app/portfolio/portfolio-items.ts#L77)까지 client 경계에 들어간다.
  - FAQ 본문은 native `<details>`인데 page 전체가 client다. 실제 JS가 필요한 것은 category navigation의 active state다.
  - 문의 페이지에서 실제 JS가 필요한 것은 form submit/format/status지만 정적 hero와 Footer도 같은 client boundary 안에 있다.
- 사용자 영향: 서버에서 완성 가능한 정적 콘텐츠도 hydration 대상이 되고, 상세 전용 데이터가 목록 route의 client module에 포함될 여지가 생긴다. 현재 콘텐츠가 작아도 경계가 데이터 증가에 그대로 비례하는 구조다.
- 유지보수 영향: metadata를 page에서 export하지 못해 [`apps/web/app/blog/layout.tsx:10`](../../../apps/web/app/blog/layout.tsx#L10) 같은 metadata-only pass-through layout이 생겼다. Server/Client 전달 가능 prop 제약도 페이지 전체로 번진다.
- 최소 수정안:
  - 각 `page.tsx`에서 `"use client"`를 제거한다.
  - `BlogSearchList`, `PortfolioFilterGrid`, `FaqCategoryNav`, `ContactForm`처럼 **현재 실제 상호작용 단위만** client leaf로 분리한다.
  - 블로그/포트폴리오 client leaf에는 목록에 필요한 view model만 서버에서 전달한다. content module 전체를 client import하지 않는다.
  - 정적 FAQ 본문과 hero, Header/Footer는 server tree에 남긴다.
- 완료 조건:
  - 위 네 `page.tsx`에 `"use client"`가 없다.
  - client reference manifest에서 각 page module과 detail-only content module이 사라지고, interaction leaf만 남는다.
  - JS 비활성 상태에서도 블로그 목록, 포트폴리오 목록, FAQ 질문/답변, 문의 입력 필드가 HTML에 보인다.
  - 검색, 필터, category active state, submit UX는 기존과 동일하게 동작한다.

### P1-3. 31,182,835-byte 배너 영상을 다섯 랜딩 페이지가 즉시 자동재생한다

- 근거: [`apps/web/components/VideoBanner.tsx:39`](../../../apps/web/components/VideoBanner.tsx#L39), [`VideoBanner.tsx:55`](../../../apps/web/components/VideoBanner.tsx#L55), [`VideoBanner.tsx:56`](../../../apps/web/components/VideoBanner.tsx#L56), [`VideoBanner.tsx:58`](../../../apps/web/components/VideoBanner.tsx#L58), [`VideoBanner.tsx:63`](../../../apps/web/components/VideoBanner.tsx#L63)
- consumer: [`apps/web/app/page.tsx:57`](../../../apps/web/app/page.tsx#L57), [`apps/web/app/about/page.tsx:40`](../../../apps/web/app/about/page.tsx#L40), [`apps/web/app/service/mvp/page.tsx:33`](../../../apps/web/app/service/mvp/page.tsx#L33), [`apps/web/app/service/app/page.tsx:39`](../../../apps/web/app/service/app/page.tsx#L39), [`apps/web/app/service/company-homepage/page.tsx:31`](../../../apps/web/app/service/company-homepage/page.tsx#L31)
- 관찰: 단일 MP4가 `autoPlay`, `loop`, `muted`, `playsInline`으로 모든 배너에서 사용되고 `poster`나 저용량 fallback이 없다. 브라우저가 전체 파일을 첫 화면에서 반드시 전송한다고 단정할 수는 없지만, autoplay는 재생에 필요한 media request를 즉시 시작한다.
- 사용자 영향: 느린 모바일 네트워크와 데이터 절약 환경에서 첫 화면의 가장 큰 네트워크 경쟁자가 될 수 있다. 영상 첫 frame 전에는 안정적인 정적 hero visual도 없다.
- 유지보수 영향: 동일한 원본 하나가 다섯 핵심 전환 페이지의 성능을 함께 좌우하지만, 현재 파일 크기/codec/poster에 대한 release gate가 없다.
- 최소 수정안: 새 video library는 추가하지 않는다. 같은 `<video>`를 유지하면서 원본을 웹 전달용으로 다시 encode하고, 실제 첫 frame과 맞는 작은 `poster`를 제공한다. 작은 viewport와 `prefers-reduced-motion`/데이터 절약 전략에서는 poster만 사용하는 정책을 먼저 정한다. codec 선택은 지원 브라우저 표가 확정된 뒤 `<source>` fallback으로 제공한다.
- 완료 조건:
  - 새 영상 파일의 byte 크기와 codec, duration을 PR에 기록하고 현재 31,182,835-byte 원본보다 작음을 확인한다.
  - video decode 전에도 poster가 hero 영역을 채워 layout/blank flash가 없다.
  - reduced-motion 정책에서 loop animation이 재생되지 않는다.
  - 모바일 throttling waterfall에서 poster/LCP와 영상 요청이 경쟁해 LCP를 늦추지 않는지 실제 브라우저 trace로 확인한다.

### P1-4. 동일한 4,154,322-byte PNG를 서로 다른 URL 두 개로 배포한다

- 근거: [`apps/web/app/contact/page.module.css:15`](../../../apps/web/app/contact/page.module.css#L15), [`apps/web/app/page.module.css:201`](../../../apps/web/app/page.module.css#L201)
- 파일: `apps/web/public/figma-assets/contact-background.png`, `apps/web/public/images/s4_bg.png`
- 관찰: 크기와 SHA-256이 완전히 같다. 파일명/URL만 다르므로 홈을 본 뒤 문의로 이동해도 브라우저는 동일 payload라는 사실을 URL 수준에서 재사용할 수 없다.
- 사용자 영향: 서로 다른 두 route에서 같은 4.15MB raster를 별도 URL로 요청할 수 있다.
- 유지보수 영향: 한 visual asset을 두 owner가 가진 것처럼 보여 압축·교체 때 drift가 생긴다.
- 최소 수정안: 의미 중립적인 단일 경로(예: `/images/marketing-grid-background.png`) 하나만 남기고 두 CSS reference를 그 URL로 바꾼다. 그 다음 중복 파일 하나를 삭제한다. 이미지 품질을 확인한 뒤 별도 단계에서 더 작은 format/quality로 재인코딩한다.
- 완료 조건:
  - 해당 hash를 가진 public 파일이 한 개뿐이다.
  - 홈과 문의 페이지의 computed `background-image`가 같은 URL을 가리킨다.
  - 첫 route 이후 두 번째 route에서 같은 배경 payload를 새 URL로 다시 받지 않는다.
  - 삭제만으로 repository/public payload가 정확히 4,154,322 bytes 줄어든다.

### P1-5. 디자인 토큰과 liquid-glass 실험이 production App Router surface에 포함된다

- 근거: [`apps/web/app/color/page.tsx:96`](../../../apps/web/app/color/page.tsx#L96), [`apps/web/app/liquid-glass/page.tsx:6`](../../../apps/web/app/liquid-glass/page.tsx#L6), [`apps/web/app/liquid-glass/page.tsx:11`](../../../apps/web/app/liquid-glass/page.tsx#L11), [`apps/web/app/liquid-glass/page.tsx:17`](../../../apps/web/app/liquid-glass/page.tsx#L17)
- 관찰: production build route table에 `/color`와 `/liquid-glass`가 실제 Static route로 생성된다. `/color`는 design token 검증 화면이고 `/liquid-glass`는 Lorem ipsum을 가진 재현 demo다. 제품 navigation에서는 연결하지 않는다.
- 사용자 영향: URL을 아는 사용자와 crawler에게 미완성 내부 화면이 공개된다. 제품 장애는 아니지만 release surface가 의도보다 넓다.
- 유지보수 영향: demo가 app root의 global CSS/metadata 계약을 공유하고, 제품용 glass code와 실험 code의 생명주기가 섞인다.
- 최소 수정안: 제품 요구가 없다면 두 route를 `app`에서 삭제한다. 개발 참고가 필요하면 앱 route가 아닌 문서/격리된 preview로 옮긴다. production에 유지해야 한다면 최소한 access/index 정책을 명시해야 하지만, “숨은 route”로 두는 것은 정책이 아니다.
- 완료 조건:
  - production build route table에 두 URL이 없거나, 사업적으로 승인된 접근 통제가 있다.
  - demo-only page/component/CSS는 production graph에서 제거된다.
  - 실제 제품에서 쓰는 `GlassSurface`, Header glass, home theme switcher는 consumer 추적 후 필요한 코드만 유지한다.

### P1-6. 디자인 표준은 Pretendard인데 실제 font file을 로드하지 않는다

- 근거: [`design-system.css:1`](../../../design-system.css#L1), 특히 [`design-system.css:2`](../../../design-system.css#L2), [`apps/web/app/layout.tsx:4`](../../../apps/web/app/layout.tsx#L4), [`apps/web/app/globals.css:31`](../../../apps/web/app/globals.css#L31)
- 관찰: `--font-sans`는 첫 family 이름을 `"Pretendard"`로 적을 뿐이다. 저장소 전체에 Pretendard `@font-face`, `next/font/local`, `localFont`, WOFF/WOFF2 import가 없다. 따라서 사용자의 OS에 Pretendard가 설치되지 않았다면 Apple SD Gothic Neo, Noto Sans KR 또는 generic sans-serif로 렌더된다. 반면 source tree의 Geist WOFF 두 개는 어떤 코드에서도 import하지 않는다.
- 사용자 영향: OS별로 글자 폭, 줄바꿈, 숫자/한글 형태가 달라져 디자인 검수 결과가 재현되지 않는다. 현재 상태에서 “Pretendard 기반 디자인 시스템”을 브라우저에 보장할 수 없다.
- 유지보수 영향: typography utility 이름과 실제 runtime font가 다르다. 스타일 차이를 breakpoint/CSS 문제로 오진하기 쉽다.
- 최소 수정안: 먼저 Pretendard self-hosting/배포 license와 승인된 subset을 확인한다. 승인되면 필요한 500/700 WOFF2만 `next/font/local`로 RootLayout에서 로드하고, 생성된 variable을 기존 `--font-sans` 계약에 연결한다. 배포 승인을 받을 수 없다면 `design.md`와 utility 이름을 실제 system font 표준으로 수정한다. 사용되지 않는 Geist WOFF는 어느 선택에서도 삭제한다.
- 완료 조건:
  - production HTML/CSS와 Network panel에서 승인된 font가 실제 로드되는 것이 확인되거나, 디자인 표준이 system stack으로 명시적으로 변경된다.
  - 한국어 500/700 weight의 computed font가 지원 OS에서 동일하다.
  - font file 수, subset, `font-display` 정책과 license 근거가 기록된다.
  - 미사용 Geist 134,132 bytes는 source tree에서 제거된다.

### P2-1. 내부 CTA가 App Router 전환 대신 전체 문서 navigation을 발생시킨다

- 근거: [`apps/web/components/cta-events.ts:34`](../../../apps/web/components/cta-events.ts#L34), 특히 [`cta-events.ts:40`](../../../apps/web/components/cta-events.ts#L40)
- consumer: [`apps/web/components/Header.tsx:158`](../../../apps/web/components/Header.tsx#L158), [`apps/web/components/VideoBanner.tsx:113`](../../../apps/web/components/VideoBanner.tsx#L113), [`apps/web/components/BottomCtaBanner.tsx:73`](../../../apps/web/components/BottomCtaBanner.tsx#L73), [`apps/web/components/ProcessSection.tsx:118`](../../../apps/web/components/ProcessSection.tsx#L118), 두 상세 CTA
- 관찰: 모두 사이트 내부 URL인데 `window.location.href`를 사용한다. 반면 카드 navigation은 [`apps/web/components/ServiceCard.tsx:35`](../../../apps/web/components/ServiceCard.tsx#L35)에서 이미 Next `Link`를 사용한다. `zerosourcing:cta-click` custom event는 저장소 안에 listener가 없다. 외부 tag manager가 listener를 주입하는지는 저장소만으로 확인할 수 없다.
- severity 근거: 전환은 느리지만 목적 URL에는 정상 도달하므로 기능 중단은 아니다. 따라서 P1 release blocker가 아니라 P2 성능/일관성 문제로 분류한다.
- 사용자 영향: CTA 클릭 때 현재 document, React tree, Header 상태를 버리고 HTML을 다시 요청한다. App Router의 client transition과 prefetch 이점을 잃는다.
- 유지보수 영향: 같은 내부 이동이 카드에서는 `Link`, 버튼에서는 hard navigation이라는 두 계약으로 갈라진다.
- 최소 수정안: `design.md` 규칙대로 CTA는 `Button onClick`을 유지하되, 작은 client CTA leaf에서 native `useRouter().push(getCtaHref(action))`를 사용한다. 저장소 내 consumer가 없는 custom event는 외부 분석 연동을 먼저 확인하고, 연동이 없으면 삭제한다. 연동이 있으면 navigation 전에 한 번만 emit한다.
- 완료 조건:
  - 내부 CTA 클릭 때 document navigation이 발생하지 않고 App Router client transition이 발생한다.
  - 뒤로가기, focus, pending/disabled 동작이 깨지지 않는다.
  - analytics event가 필요하다면 클릭당 정확히 한 번 기록되고, 필요하지 않다면 dead event 코드가 없다.

### P2-2. Slack upstream 호출에 deadline과 network-error mapping이 없다

- 근거: [`apps/web/app/api/contact/route.ts:114`](../../../apps/web/app/api/contact/route.ts#L114), [`route.ts:134`](../../../apps/web/app/api/contact/route.ts#L134), [`route.ts:148`](../../../apps/web/app/api/contact/route.ts#L148)
- 관찰: `fetch`에 signal/deadline이 없고 network reject를 감싸는 `try/catch`도 없다. HTTP/API 오류는 502로 매핑하지만 DNS, connection, timeout 계열 reject는 framework 기본 500 경로로 빠진다.
- 사용자 영향: Slack이 느리거나 연결되지 않을 때 문의 버튼의 pending 상태가 upstream/platform timeout까지 길어질 수 있고, 실패 유형에 따라 응답 계약이 달라진다.
- 유지보수 영향: 운영 로그에서 validation 실패, Slack API 실패, network timeout을 같은 방식으로 분류하기 어렵다.
- 최소 수정안: Node 20/현재 runtime의 native `AbortSignal.timeout()` 또는 명시적 `AbortController`로 합의된 upstream deadline을 적용하고, fetch/network/JSON parse 실패를 한 곳에서 log한 뒤 안정된 502 응답으로 매핑한다. retry queue나 새 메시징 의존성은 실제 유실 요구가 확인되기 전에는 추가하지 않는다.
- 완료 조건:
  - Slack이 응답하지 않아도 정해진 deadline 안에 API가 종료된다.
  - timeout/network failure는 token이나 개인정보 없이 구분 가능한 server log와 일관된 502 payload를 남긴다.
  - 성공과 Slack `ok:false` 경로는 기존 계약을 유지한다.

### P2-3. `notFound()`를 쓰지만 제품용 not-found/error boundary가 없다

- 근거: [`apps/web/app/blog/[slug]/page.tsx:84`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L84), [`apps/web/app/portfolio/[slug]/page.tsx:41`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L41), route root인 [`apps/web/app/layout.tsx:27`](../../../apps/web/app/layout.tsx#L27)
- 관찰: `apps/web/app` 아래에는 사용자 정의 `not-found.tsx`, `error.tsx`, `global-error.tsx`가 없다. build에는 framework 기본 `/_not-found`가 생성된다.
- 사용자 영향: 잘못된 slug나 예기치 않은 render 오류에서 브랜드 navigation/복구 동선이 없는 기본 fallback에 의존한다.
- 유지보수 영향: route 오류가 발생했을 때 reset/home/contact 같은 표준 복구 계약이 없다.
- 최소 수정안: route group 정리 뒤 `(marketing)/not-found.tsx`와 필요한 최소 `error.tsx`를 App Router convention으로 추가한다. 정적 페이지에 의미 없는 `loading.tsx`를 일괄 추가하지 않는다. `error.tsx`만 필요한 최소 client boundary로 둔다.
- 완료 조건:
  - 알 수 없는 blog/portfolio slug에서 브랜드 404와 홈/목록 이동 링크가 나온다.
  - 의도적으로 throw한 route render 오류에서 error boundary가 표시되고 reset 또는 안전한 이동이 가능하다.
  - 정상 정적 route의 rendering mode가 dynamic으로 바뀌지 않는다.

### P2-4. FAQ sticky/scrollspy가 CSS와 IntersectionObserver가 할 일을 매 scroll마다 layout read로 처리한다

- 근거: [`apps/web/app/faq/page.tsx:25`](../../../apps/web/app/faq/page.tsx#L25), [`faq/page.tsx:33`](../../../apps/web/app/faq/page.tsx#L33), [`faq/page.tsx:41`](../../../apps/web/app/faq/page.tsx#L41), [`faq/page.tsx:76`](../../../apps/web/app/faq/page.tsx#L76), [`faq/page.tsx:109`](../../../apps/web/app/faq/page.tsx#L109), [`faq/page.module.css:31`](../../../apps/web/app/faq/page.module.css#L31)
- 관찰: scroll event마다 모든 FAQ section의 `getBoundingClientRect()`를 읽고, 별도로 sidebar/panel/parent rect와 panel height도 읽는다. `fixed`와 `absolute` class를 JS state로 전환해 sticky stop을 직접 구현한다.
- 사용자 영향: FAQ 스크롤 중 main thread에서 반복 layout read와 React state update가 일어난다. 현재 section 수가 작아 즉시 심각하다고 단정할 수는 없지만 native 기능으로 제거 가능한 지속 비용이다.
- 유지보수 영향: `NAV_STICKY_TOP`, CSS `top`, `scroll-margin-top`이 서로 맞아야 하며 breakpoint 변경 때 JS geometry까지 함께 검증해야 한다.
- 최소 수정안: panel은 CSS `position: sticky; top: 128px`로 두어 parent 끝에서 native하게 멈추게 한다. active section만 필요하면 `IntersectionObserver`의 root margin으로 관찰한다. category 이동은 기본 `href="#id"` link로 두고 smooth scroll은 enhancement로 남긴다.
- 완료 조건:
  - `stickyMode`, sidebar/panel refs, sticky 계산용 scroll handler가 삭제된다.
  - scroll 중 모든 section을 순회하는 `getBoundingClientRect()`가 없다.
  - 직접 hash URL 진입, keyboard navigation, reduced-motion에서 category 이동이 작동한다.
  - 639/640, 767/768, 1079/1080 경계에서도 panel이 footer/content 밖으로 넘치지 않는다.

### P2-5. 홈에 독립적인 theme owner 두 개가 동시에 렌더된다

- 근거: [`apps/web/app/page.tsx:53`](../../../apps/web/app/page.tsx#L53), [`apps/web/app/page.tsx:56`](../../../apps/web/app/page.tsx#L56), [`apps/web/components/BottomFloatingThemeSwitcher.tsx:20`](../../../apps/web/components/BottomFloatingThemeSwitcher.tsx#L20), [`BottomFloatingThemeSwitcher.tsx:40`](../../../apps/web/components/BottomFloatingThemeSwitcher.tsx#L40), [`apps/web/components/BottomFloatingThemeSwitcherWide.tsx:25`](../../../apps/web/components/BottomFloatingThemeSwitcherWide.tsx#L25), [`BottomFloatingThemeSwitcherWide.tsx:72`](../../../apps/web/components/BottomFloatingThemeSwitcherWide.tsx#L72)
- 관찰: 홈은 기존 pill과 새 wide switcher를 함께 렌더한다. 두 컴포넌트는 각각 독립적인 `theme`/`previousTheme` state를 갖고 같은 `document.documentElement.dataset.theme`를 쓰고 cleanup에서 삭제한다. 한 control을 바꾸면 다른 control의 선택 표시는 동기화되지 않는다.
- 사용자 영향: 실제 page theme와 두 control 중 하나의 selected visual이 서로 다를 수 있다. 같은 기능의 fixed UI가 두 개 보여 제품 화면과 실험 화면의 경계도 불명확하다.
- 유지보수 영향: 전역 theme에 writer가 둘이고 source of truth가 없다. route layout으로 옮기면 cleanup/order 문제까지 전 페이지로 확대될 수 있다.
- 최소 수정안: 비교 실험이라면 Wide switcher를 제품 홈에서 삭제하고 `/liquid-glass` 같은 격리 preview에서만 비교한다. 제품 기능이라면 pill/wide 중 하나만 승인해 남긴다. 둘을 반드시 동시에 제공해야 한다는 제품 요구가 확인되기 전에는 context/store를 새로 만들지 않는다.
- 완료 조건:
  - production 화면에는 전역 theme를 쓰는 owner/control이 하나뿐이다.
  - 선택 표시와 `html[data-theme]`가 항상 일치한다.
  - 선택한 theme를 route 전환 후 유지해야 하는지 제품 계약이 명시되고 그 범위에서만 구현된다.

### P2-6. 두 glass filter manager가 geometry마다 cache와 SVG DOM을 늘리지만 pruning이 없다

- 근거:
  - [`apps/web/components/glassFilter.ts:35`](../../../apps/web/components/glassFilter.ts#L35), [`glassFilter.ts:38`](../../../apps/web/components/glassFilter.ts#L38), [`glassFilter.ts:178`](../../../apps/web/components/glassFilter.ts#L178), [`glassFilter.ts:214`](../../../apps/web/components/glassFilter.ts#L214), [`glassFilter.ts:216`](../../../apps/web/components/glassFilter.ts#L216)
  - [`apps/web/components/liquidGlassFilter.ts:40`](../../../apps/web/components/liquidGlassFilter.ts#L40), [`liquidGlassFilter.ts:42`](../../../apps/web/components/liquidGlassFilter.ts#L42), [`liquidGlassFilter.ts:170`](../../../apps/web/components/liquidGlassFilter.ts#L170), [`liquidGlassFilter.ts:186`](../../../apps/web/components/liquidGlassFilter.ts#L186), [`liquidGlassFilter.ts:197`](../../../apps/web/components/liquidGlassFilter.ts#L197)
  - 추가 consumer: [`apps/web/components/Header.tsx:53`](../../../apps/web/components/Header.tsx#L53), [`apps/web/components/GlassSurface.tsx:70`](../../../apps/web/components/GlassSurface.tsx#L70), [`apps/web/components/BottomFloatingThemeSwitcherWide.tsx:43`](../../../apps/web/components/BottomFloatingThemeSwitcherWide.tsx#L43)
- 관찰: 두 manager 모두 size를 8px 단위로 quantize한 key로 `Map`에 보관하고, cache miss마다 새 `<filter>`를 숨은 SVG에 append한다. `Map.delete`, DOM `remove`, max entry, reference count가 없다. Header뿐 아니라 새 wide switcher도 가변 폭으로 같은 liquid manager를 소비한다. 따라서 한 session에서 distinct geometry를 만날 때마다 cache entry와 filter DOM이 계속 증가한다는 점은 trace 없이도 코드로 확정된다.
- 사용자 영향: 일반 방문에서 즉시 체감될 크기라고 단정할 수는 없지만, resize·회전·responsive shell 변경이 반복되는 긴 session에서 retained data URL/Promise와 SVG node가 누적된다.
- 유지보수 영향: “cache로 최적화했다”는 설명과 달리 cache 생명주기/상한 계약이 없다. 새 glass consumer를 추가할수록 geometry 조합이 곱해진다.
- 최소 수정안: 먼저 P2-5처럼 중복/실험 consumer를 삭제한다. 남은 manager에는 이 용도에 한정된 작은 entry 상한과 사용 중 filter를 깨뜨리지 않는 release 정책을 둔다. 범용 LRU dependency는 추가하지 않는다. 구현 복잡도가 visual 이득보다 커지면 refraction을 고정 geometry에만 허용하고 나머지는 CSS fallback으로 제한한다.
- 완료 조건:
  - 반복 viewport resize/rotation 후 `Map.size`와 `svg[data-zs-glass-defs] filter`, `svg[data-zs-liquid-glass-defs] filter` 개수가 정해진 상한을 넘지 않는다.
  - 현재 화면이 참조하는 filter는 pruning으로 제거되지 않는다.
  - consumer unmount 후 더 이상 필요 없는 geometry가 release되거나, 문서화된 작은 상한 안에서 재사용된다.

### P2-7. 큰 Header와 Wide switcher에 Chromium 전용 per-frame refraction을 적용하지만 성능/절전 gate가 없다

- 근거: [`apps/web/components/Header.tsx:41`](../../../apps/web/components/Header.tsx#L41), [`Header.tsx:47`](../../../apps/web/components/Header.tsx#L47), [`Header.tsx:57`](../../../apps/web/components/Header.tsx#L57), [`apps/web/components/BottomFloatingThemeSwitcherWide.tsx:31`](../../../apps/web/components/BottomFloatingThemeSwitcherWide.tsx#L31), [`BottomFloatingThemeSwitcherWide.tsx:43`](../../../apps/web/components/BottomFloatingThemeSwitcherWide.tsx#L43), [`apps/web/app/glass.css:12`](../../../apps/web/app/glass.css#L12)
- 관찰: 코드 주석 자체가 refraction이 Chromium에서 요소별 per-frame backdrop cost를 낸다고 기록한다. 그런데 Header와 최대 1360px wide switcher에 URL displacement + blur + saturation을 적용하고, 지원 여부 외에 reduced-motion, 저성능/절전, 작은 viewport gate는 없다. 실제 frame cost는 이번 리뷰에서 trace하지 않았으므로 회귀로 단정하지 않는다.
- 사용자 영향: 저사양 Chromium에서 scroll/animation 합성 비용이 커질 위험이 있다. Header는 모든 핵심 페이지에 존재하고 Wide switcher는 홈의 큰 fixed surface이므로 측정 우선순위가 높다.
- 유지보수 영향: visual fidelity는 정교하지만 허용 가능한 frame time, fallback 조건, cache 상한이 제품 계약으로 정의되지 않았다.
- 최소 수정안: 우선 P2-5에서 제품 theme switcher 하나만 남기고, route layout으로 Header를 한 번만 mount한다. 그 다음 남은 큰 surface를 실제 Chrome Performance trace에서 refraction on/off 비교한다. 차이가 확인되면 새 library 없이 CSS blur fallback을 기본으로 하고 충분한 환경에서만 opt-in한다. 두 glass engine을 “비슷해 보인다”는 이유만으로 즉시 합치지는 않는다. Header와 badge가 같은 visual contract인지 먼저 확인한다.
- 완료 조건:
  - 대표 mobile/desktop Chromium에서 refraction on/off trace와 frame/paint 근거가 PR에 남는다.
  - 승인 기준을 넘는 환경에서는 plain CSS glass fallback이 사용된다.
  - Safari/Firefox fallback과 Header readability가 유지된다.

### P3-1. `CardCarousel`이 같은 resize를 두 경로로 관찰한다

- 근거: [`apps/web/components/CardCarousel.tsx:53`](../../../apps/web/components/CardCarousel.tsx#L53), [`CardCarousel.tsx:66`](../../../apps/web/components/CardCarousel.tsx#L66), [`CardCarousel.tsx:68`](../../../apps/web/components/CardCarousel.tsx#L68)
- 관찰: `ResizeObserver`가 viewport size 변화를 이미 감지하지만 같은 `update`를 `window.resize`에도 등록한다. window resize 때 동일 계산과 state set이 중복 호출될 수 있다.
- 사용자/유지보수 영향: 작은 비용이지만 consumer 네 곳에서 반복되고, 두 listener의 cleanup 계약을 유지해야 한다.
- 최소 수정안: `ResizeObserver`만 남기고 window listener 두 줄과 cleanup을 삭제한다. CSS/container query 전환은 별도 visual 검증 없이 이번 수정에 묶지 않는다.
- 완료 조건: viewport resize와 부모 container resize에서 mode가 계속 갱신되고, 등록된 window resize listener는 없다.

### P3-2. 사용되지 않는 Geist font binary 두 개가 source tree에 남아 있다

- 근거: `apps/web/app/fonts/GeistVF.woff` (66,268 bytes), `apps/web/app/fonts/GeistMonoVF.woff` (67,864 bytes), [`apps/web/app/layout.tsx:1`](../../../apps/web/app/layout.tsx#L1), [`apps/web/app/globals.css:1`](../../../apps/web/app/globals.css#L1)
- 관찰: 코드에서 `next/font`, `localFont`, 해당 파일 경로, `Geist` family 참조가 없다. 현재 design system은 Pretendard를 사용한다.
- 사용자 영향: import가 없어 현재 browser request 비용은 확인되지 않았다.
- 유지보수 영향: 어떤 font가 제품 표준인지 혼동시키고 source/deploy input만 늘린다.
- 최소 수정안: 향후 사용 계획이 문서화되지 않았다면 두 binary를 삭제한다. Pretendard loading 전략은 별도 요구가 생기기 전 새 font loader 추상화로 확장하지 않는다.
- 완료 조건: `apps/web/app/fonts`의 dead binary가 없고 production build의 typography가 바뀌지 않는다.

## 과하게 고치지 말아야 할 것

- 현재 콘텐츠가 로컬 상수라는 이유만으로 CMS, query library, global state store를 먼저 넣지 않는다. RSC boundary와 canonical data owner를 먼저 정리하면 된다.
- 모든 client component를 dynamic import하지 않는다. Header/menu처럼 즉시 필요한 상호작용은 작은 정적 client chunk가 낫다.
- 정적 마케팅 페이지마다 `loading.tsx`를 만들지 않는다. 실제 async segment와 의미 있는 fallback이 생길 때만 추가한다.
- `glassFilter.ts`와 `liquidGlassFilter.ts`는 구현이 둘이라는 이유만으로 합치지 않는다. Header와 작은 badge가 같은 시각 계약을 공유한다는 증거가 먼저다.
- `CardCarousel`을 범용 carousel library로 교체하지 않는다. 우선 중복 resize listener만 삭제하고, container query 전환은 consumer별 snapshot이 준비된 뒤 판단한다.
- package-level barrel export나 새 “frontend framework” 폴더를 만들지 않는다. 현재 direct import는 tree-shaking과 ownership 면에서 오히려 명확하다.

## 권장 수정 순서

1. 승인된 Pretendard loading 또는 system font 표준 중 하나를 먼저 확정한다. 동시에 dead Geist를 삭제한다.
2. 동일 PNG를 단일 URL로 합치고 31MB 영상에 poster/재인코딩 정책을 적용한다. 가장 직접적인 network 비용부터 줄인다.
3. production demo route를 격리하고 홈의 pill/wide theme switcher 중 제품 variant 하나만 남긴다.
4. `(marketing)/layout.tsx`로 Header/Footer를 한 번만 소유하게 만든다.
5. blog/portfolio/FAQ/contact를 Server page + 작은 client island로 분리한다.
6. CTA를 App Router navigation으로 바꾸고 consumer 없는 analytics event의 실제 외부 의존을 확인한다.
7. Slack deadline/error mapping, marketing 404/error boundary를 추가한다.
8. FAQ sticky/scrollspy와 CardCarousel listener를 native 기능으로 줄인다.
9. 남은 glass cache의 생명주기/상한을 정하고, 실제 Chrome trace를 근거로 큰 surface의 refraction fallback 정책을 확정한다.

## 최종 완료 기준

- production build와 TypeScript가 계속 통과하고 핵심 공개 route는 Static/SSG 상태를 유지한다.
- Pretendard를 실제로 load하거나 디자인 표준을 실제 system font와 일치시킨다.
- 마케팅 Header/Footer는 native route-group layout 한 곳에서만 렌더된다.
- page-level `"use client"`는 제거되고 query/filter/form/scrollspy만 client island다.
- 내부 CTA는 full document navigation 없이 이동한다.
- 31,182,835-byte 원본 영상과 4,154,322-byte 중복 PNG 문제가 제거되고 전후 파일/전송 근거가 남는다.
- `/color`, `/liquid-glass`는 production 제품 surface가 아니거나 명시적으로 승인된 접근 정책을 가진다.
- production의 전역 theme writer/control은 하나이고 선택 표시와 실제 theme가 일치한다.
- Slack 장애가 무기한 pending이나 제각각인 500으로 끝나지 않는다.
- 제품 404/error recovery가 App Router convention으로 존재한다.
- FAQ scroll과 carousel resize에 중복 layout/listener 비용이 없다.
- glass filter cache와 SVG DOM은 반복 resize 뒤에도 문서화된 상한을 넘지 않는다.
- 새 runtime dependency는 0개다.

## Ponytail 판정

- `native:` 반복된 마케팅 shell은 wrapper 컴포넌트가 아니라 Next route-group layout으로 대체한다. [`apps/web/app/page.tsx:50`](../../../apps/web/app/page.tsx#L50)
- `native:` FAQ fixed/absolute sticky state machine은 CSS `position: sticky`와 hash link/IntersectionObserver로 줄인다. [`apps/web/app/faq/page.tsx:25`](../../../apps/web/app/faq/page.tsx#L25)
- `delete:` production 목적이 없는 `/color`, `/liquid-glass`, dead Geist binaries와 중복 theme switcher variant를 product graph에서 제거한다. [`apps/web/app/color/page.tsx:96`](../../../apps/web/app/color/page.tsx#L96)
- `shrink:` `CardCarousel`의 window resize listener는 이미 존재하는 `ResizeObserver`와 중복이므로 삭제한다. [`apps/web/components/CardCarousel.tsx:66`](../../../apps/web/components/CardCarousel.tsx#L66)
- `yagni:` 실제 수신자가 확인되지 않은 CTA custom event를 미래 analytics라는 이유만으로 유지하지 않는다. 외부 연동 확인 후 유지 또는 삭제한다. [`apps/web/components/cta-events.ts:22`](../../../apps/web/components/cta-events.ts#L22)
- net: 새 dependency `-0`; 확정 가능한 duplicate asset `-4,154,322 bytes`, dead font source `-134,132 bytes`. 코드 line 감소량은 route 격리 여부와 visual contract 확정 전에는 추정하지 않는다.
