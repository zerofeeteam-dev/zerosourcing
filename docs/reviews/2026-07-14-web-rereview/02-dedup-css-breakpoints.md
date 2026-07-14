# Web 재리뷰 — 중복 데이터 / 중복 CSS / 브레이크포인트

- 리뷰 일자: 2026-07-14
- 범위: `apps/web`와 `apps/web`이 실제 사용하는 `packages/ui` 코드 (`apps/admin` 제외)
- 제외: 전담 테스트 품질 리뷰, 제품 코드 수정
- 기준: `AGENTS.md`, `design.md`, import/consumer 추적, CSS 선언 비교, 정적 자산 SHA-256 비교
- 스냅샷: `HEAD 0260d00`에 현재 작업 트리 변경을 포함했다. 특히 `BottomFloatingThemeSwitcherWide.*`는 아직 untracked이고 홈의 관련 변경도 uncommitted인 상태이므로, 이 부분은 완료된 설계가 아니라 **진행 중인 실험**으로 판정했다.
- 측정 기준선: 웹과 실제 소비 UI 패키지에 CSS 30개, 6,940줄, `@media` 86개가 있다. 파일 줄 수는 `wc -l`, 자산 크기는 실제 byte, 중복 자산은 SHA-256으로 확인했다.

## CTO 결론

이전보다 좋아진 부분은 분명하다. 반복되는 섹션 렌더링은 `SectionShell`, FAQ는 `FaqSection`, 카드 스크롤은 `CardCarousel`, 지표는 `ProofMetrics`로 이미 모였다. 포트폴리오에도 slug와 실제 상세 링크가 생겼다. 즉, **화면 컴포넌트의 재사용 방향은 맞다.**

하지만 데이터와 CSS의 소유권은 아직 그 수준을 따라오지 못했다. 같은 FAQ, 포트폴리오, 실적 수치, 회사 정보가 화면별 파일에 복사되어 있고, 일부는 이미 서로 다른 문구나 전화번호로 갈라졌다. CSS도 공통 컴포넌트의 기본값을 소비자가 다시 선언하거나, 실험 컴포넌트를 파일째 복사하는 방식이 남아 있다.

현재 가장 먼저 고칠 것은 다음 네 가지다.

1. 회사 공식 정보의 단일 원본을 만들고 충돌하는 전화번호를 사업 담당자가 확정한다.
2. 홈에 동시에 렌더되는 두 테마 스위처 중 제품상 하나를 선택한다. 현재는 코드 중복을 넘어 전역 테마 상태가 서로 어긋날 수 있다.
3. FAQ·포트폴리오·실적의 “한 엔터티, 한 원본” 구조를 만든다.
4. 브레이크포인트를 숫자 하나로 억지 통일하지 말고 `layout tier`, `reference frame`, `section compact`, `component fit` 네 역할로 구분한다.

판정은 **수정 필요**다. 즉시 장애를 일으키는 코드 수준 P0는 없지만, 잘못된 공개 연락처는 사용자와 검색 엔터티에 직접 영향을 주므로 콘텐츠 P0로 본다. 새 스위처 중복은 현재 작업 트리에서 새로 생긴 P1 기능 위험이다.

## 확인된 개선점

- [`FaqSection.tsx`](../../../apps/web/components/FaqSection.tsx#L7)은 데이터만 받아 native `details`로 렌더한다. 새 FAQ 컴포넌트를 더 만들 필요가 없다.
- [`portfolio-items.ts`](../../../apps/web/app/portfolio/portfolio-items.ts#L11)의 항목과 홈 포트폴리오에는 stable slug가 있다. 이제 배열 index가 아닌 ID 선택으로 통합할 기반이 마련됐다.
- [`ProofMetrics.tsx`](../../../apps/web/components/ProofMetrics.tsx#L1)와 [`CardCarousel.tsx`](../../../apps/web/components/CardCarousel.tsx#L1)은 이미 여러 화면이 쓰는 공통 표현이다. 데이터 원본만 합치면 된다.
- [`SectionShell.module.css`](../../../apps/web/components/SectionShell.module.css#L1)은 섹션의 기본 padding, gap, title 크기를 한 곳에서 제공한다. 방향은 맞고, 소비자 쪽의 동일 기본값 선언만 지우면 된다.
- [`Button`](../../../packages/ui/src/button.tsx#L68)은 gradient stop을 한 곳에서 관리한다. 페이지가 raw gradient를 다시 만들지 않는 점은 `design.md` 규칙에 맞다.
- 포트폴리오 카드와 상세 문구처럼 **목적이 달라 실제 문구도 다른 값**은 무조건 같게 만들지 않았다. 아래 수정안도 엔터티 소유권만 합치고 view별 표현 차이는 명시적으로 보존한다.

## 중복 판정 기준

| 구분            | 판정                                          | 처리 원칙                                                 |
| --------------- | --------------------------------------------- | --------------------------------------------------------- |
| 완전 동일       | byte/hash, 문자열, 선언 블록이 같다           | consumer 확인 후 바로 하나를 삭제한다                     |
| 의미 중복       | 같은 FAQ·회사·프로젝트인데 표현이 일부 다르다 | 자동 병합하지 않고 콘텐츠 owner가 canonical 값을 승인한다 |
| 유사 구현       | UI 목적은 같지만 geometry·동작 계약이 다르다  | 먼저 제품에서 하나를 삭제할 수 있는지 결정한다            |
| 우연한 CSS 유사 | `display:flex`, `gap`, 일반 card 모양만 같다  | 공통 API로 만들지 않는다                                  |

## 남은 문제

### P0-1. 회사 공식 정보가 세 원본으로 갈라졌고 전화번호가 충돌한다

- 근거:
  - [`about/content.ts:78`](../../../apps/web/app/about/content.ts#L78)과 [`about/content.ts:88`](../../../apps/web/app/about/content.ts#L88): `02-1234-5678`
  - [`Footer.tsx:7`](../../../apps/web/components/Footer.tsx#L7)과 [`Footer.tsx:9`](../../../apps/web/components/Footer.tsx#L9): `010-3242-8118`
  - [`organization-json-ld.json:5`](../../../apps/web/app/organization-json-ld.json#L5), [`organization-json-ld.json:18`](../../../apps/web/app/organization-json-ld.json#L18), [`organization-json-ld.json:25`](../../../apps/web/app/organization-json-ld.json#L25): 이름·주소·대표자·이메일을 별도로 복사
- 중복 종류: 상호, 대표자, 주소, 이메일은 의미상 동일한 회사 facts다. 전화번호는 단순 중복이 아니라 **충돌**이다.
- 영향: 사용자가 잘못된 번호로 연락할 수 있고, Footer/About/구조화 데이터가 앞으로 더 쉽게 갈라진다. NAP 일관성도 깨진다.
- 최소 수정안:
  1. 사업 담당자가 공식 대표번호와 고객센터 번호의 실제 의미를 먼저 확정한다. 코드를 보고 추론하지 않는다.
  2. `apps/web/content/company.ts` 한 곳에 법적 상호, 브랜드명, 대표자, 사업자번호, 통신판매번호, 주소, 이메일, 검증된 전화번호를 둔다.
  3. About, Footer, Organization JSON-LD는 이 값을 import해 표현만 각자 조합한다. 지도 검색용 `mapQuery`는 표시 주소와 목적이 다르므로 별도 필드로 둔다.
  4. JSON 정적 파일이 TS 값을 import할 수 없으므로 schema 객체를 TS 모듈로 바꾸거나 layout에서 company facts로 조립한다.
- 완료 조건:
  - `02-1234-5678` placeholder가 저장소와 렌더 결과에서 사라진다.
  - 서로 다른 번호를 유지하면 `대표번호`, `고객센터`처럼 역할이 명시된다.
  - 상호·대표자·주소·이메일·전화번호의 값 owner가 한 파일뿐이다.
  - JSON-LD의 검증된 공개 값이 화면과 일치한다.

### P1-1. 홈의 두 테마 스위처는 복사 구현이며 전역 상태가 서로 어긋날 수 있다

- 근거:
  - 홈은 [`page.tsx:53`](../../../apps/web/app/page.tsx#L53)에서 compact 스위처를, [`page.tsx:56`](../../../apps/web/app/page.tsx#L56)에서 wide 스위처를 동시에 렌더한다.
  - compact는 TSX 107줄/CSS 307줄, wide는 TSX 118줄/CSS 315줄이다. CSS diff는 20줄 추가·12줄 삭제뿐이어서 대부분이 그대로 복사됐다.
  - 두 컴포넌트 모두 독립 `theme` state를 만들고 [`BottomFloatingThemeSwitcher.tsx:40`](../../../apps/web/components/BottomFloatingThemeSwitcher.tsx#L40), [`BottomFloatingThemeSwitcherWide.tsx:72`](../../../apps/web/components/BottomFloatingThemeSwitcherWide.tsx#L72)에서 각각 `document.documentElement.dataset.theme`를 쓴다.
  - [`page.module.css:24`](../../../apps/web/app/page.module.css#L24)는 두 컨트롤을 겹치지 않게 하려고 자식 `fieldset`의 내부 custom property를 `116px`로 덮는다.
  - 두 테스트 파일도 각각 79줄/80줄로 복제됐다. 이는 테스트 품질 이슈가 아니라 production 구조가 복사됐다는 보조 증거다.
- 영향:
  - compact에서 dark를 선택해도 wide UI는 light 선택 상태로 남는다. 이후 wide에서 dim을 선택하면 전역은 dim이지만 compact는 dark로 보인다.
  - 한쪽 effect가 unmount되며 root dataset을 삭제하면 남은 컨트롤의 선택과 실제 테마가 달라질 수 있다.
  - 같은 UI 변경을 TSX 2곳, CSS 2곳, 보조 검증 2곳에서 맞춰야 한다.
- 최소 수정안 우선순위:
  1. **제품에서 하나만 선택한다.** compact를 유지하면 새 wide TSX/CSS 433 product LOC와 보조 검증 80줄을 삭제한다. wide를 유지하면 기존 compact TSX/CSS 414 product LOC와 보조 검증 79줄을 삭제한다.
  2. 화면 폭에 따라 모양만 바뀌어야 한다면 dynamic resize filter가 있는 한 컴포넌트의 CSS geometry를 반응형으로 바꾼다. 두 stateful 인스턴스를 두지 않는다.
  3. 두 컨트롤이 동시에 보여야 한다는 제품 요구가 확정된 경우에만 하나의 controller/state를 공유하고, `compact | wide` variant와 공통 material/control CSS를 분리한다. 범용 glass mega-component는 만들지 않는다.
- 완료 조건:
  - 제품 요구가 한 컨트롤이면 Home의 theme switcher consumer가 1개다.
  - 두 컨트롤을 유지하면 theme state와 root dataset writer가 각각 1개다.
  - 어느 컨트롤을 조작해도 보이는 selected 상태와 `html[data-theme]`가 일치한다.
  - `page.module.css`가 자식 `fieldset` 구현 세부를 선택하지 않는다.
  - 중복 variant를 제거하면 `@media`도 2개 줄어 86개에서 84개가 된다.

### P1-2. FAQ의 실제 문구가 화면별 복사본에서 이미 drift했다

- 완전 동일:
  - 홈 [`content.ts:234`](../../../apps/web/app/content.ts#L234)의 FAQ 7개는 FAQ 페이지 [`faq/content.ts:27`](../../../apps/web/app/faq/content.ts#L27)의 `commonFaqs`와 같다.
  - MVP 랜딩 [`service/mvp/content.ts:84`](../../../apps/web/app/service/mvp/content.ts#L84)의 5개는 FAQ 페이지 [`faq/content.ts:177`](../../../apps/web/app/faq/content.ts#L177)의 `mvpFaqs`와 같다.
- 같은 질문, 다른 답변:
  - 앱 랜딩 [`service/app/content.ts:138`](../../../apps/web/app/service/app/content.ts#L138)과 FAQ 페이지 [`faq/content.ts:205`](../../../apps/web/app/faq/content.ts#L205)는 질문 5개가 같지만 두 답변의 길이가 다르다. 앱 랜딩에만 1개가 더 있다.
  - 기업 홈페이지 랜딩 [`service/company-homepage/content.ts:68`](../../../apps/web/app/service/company-homepage/content.ts#L68)과 FAQ 페이지 [`faq/content.ts:233`](../../../apps/web/app/faq/content.ts#L233)는 질문 5개가 같지만 네 답변이 다르다. 랜딩에만 모바일 질문 1개가 더 있다.
- 영향: 가격·기간·지원 범위 같은 약속을 한 곳만 수정하면 다른 랜딩은 과거 문구를 계속 노출한다. FAQ schema나 AEO용 근거를 추가할 때도 어떤 답변이 공식인지 판단하기 어렵다.
- 최소 수정안:
  - `apps/web/content/faqs.ts`에 stable FAQ ID와 canonical 질문·답변을 둔다.
  - 홈, FAQ 허브, 서비스 랜딩은 ID 배열로 노출 항목만 선택한다. 기존 `FaqSection`은 그대로 쓴다.
  - 길이가 다른 답변이 실제 편집 요구라면 `short`/`long`을 관성적으로 만들지 말고, 콘텐츠 owner 승인과 사용 목적을 필드명으로 명시한다.
- 완료 조건:
  - 같은 의미의 FAQ ID는 한 원본만 가진다.
  - 페이지별 파일에는 FAQ 본문이 아니라 ID 선택만 남는다.
  - 서비스 랜딩과 FAQ 허브의 답변 차이가 모두 의도된 variant이거나 사라진다.
  - 예상 감소량: 콘텐츠 약 90~110줄. 문구 승인 전에는 자동 삭제하지 않는다.

### P1-3. 4,154,322-byte PNG가 byte 단위로 완전히 중복된다

- 근거:
  - [`public/figma-assets/contact-background.png`](../../../apps/web/public/figma-assets/contact-background.png)
  - [`public/images/s4_bg.png`](../../../apps/web/public/images/s4_bg.png)
  - 두 파일의 SHA-256은 `b8658c2441a57b5aa43ea22c753453a5a274428ef30645cebbe173b9f66a0400`, 크기는 각각 4,154,322 bytes다.
  - consumer는 [`contact/page.module.css:15`](../../../apps/web/app/contact/page.module.css#L15)와 [`page.module.css:201`](../../../apps/web/app/page.module.css#L201)이다.
- 영향: 배포 artifact가 4.15MB 커지고, 브라우저는 URL이 달라 동일 이미지라는 사실을 모르므로 두 페이지를 방문하면 별도 cache entry와 전송이 생길 수 있다.
- 최소 수정안: 의미가 중립적인 `/images/marketing-grid-background.png` 한 파일로 이름을 정하고 두 CSS URL을 바꾼 뒤 나머지를 삭제한다.
- 완료 조건:
  - 해당 SHA를 가진 public 파일이 1개다.
  - Contact와 홈이 같은 URL을 사용한다.
  - 두 배경의 crop/position은 기존과 동일하다.
  - 정확한 감소량: **4,154,322 bytes**.

### P2-1. 포트폴리오·실적·블로그 preview가 서로 다른 목록에서 같은 엔터티를 다시 쓴다

| 데이터     | 근거                                                                                                                                                                                                                                                                                                                                                                                                           | 판정                                                                    | 최소 수정안                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 포트폴리오 | [`portfolio-items.ts:11`](../../../apps/web/app/portfolio/portfolio-items.ts#L11)의 카드 9개와 [`portfolio-items.ts:77`](../../../apps/web/app/portfolio/portfolio-items.ts#L77)의 상세 9개가 같은 slug를 반복한다. 홈 [`content.ts:168`](../../../apps/web/app/content.ts#L168)은 그중 6개, [`ServicePortfolioSection.tsx:9`](../../../apps/web/components/ServicePortfolioSection.tsx#L9)은 3개를 다시 쓴다. | 같은 엔터티지만 카드/상세 title·category·설명이 일부 의도적으로 다르다. | `apps/web/content/portfolio.ts` 한 record에서 공통 slug/기본 facts를 소유하고, 필요한 경우 `card`/`detail` 표시 override만 둔다. 홈·서비스는 ID를 명시적으로 선택한다. |
| 실적 수치  | 홈 [`content.ts:24`](../../../apps/web/app/content.ts#L24)과 About [`about/content.ts:55`](../../../apps/web/app/about/content.ts#L55)의 4개가 완전히 같다. 포트폴리오 [`portfolio-items.ts:1`](../../../apps/web/app/portfolio/portfolio-items.ts#L1)은 앞 3개의 부분집합이다.                                                                                                                                | 완전 동일 + 부분집합                                                    | `company-proof.ts` 한 원본에서 stable ID로 선택한다. 의미가 숨는 `slice(0, 3)`은 쓰지 않는다.                                                                          |
| 블로그     | [`blog-posts.ts:21`](../../../apps/web/app/blog/blog-posts.ts#L21)은 같은 related slug를 한 배열에 두 번 넣고, [`blog-posts.ts:97`](../../../apps/web/app/blog/blog-posts.ts#L97)은 같은 두 글을 세 번씩 반복한다. 홈 [`content.ts:207`](../../../apps/web/app/content.ts#L207)은 같은 slug에 다른 제목/설명을 붙였다.                                                                                         | 일부는 명백한 placeholder 반복, 홈 preview는 canonical 글과 불일치      | 공개할 실제 글만 고유하게 두고, 홈은 canonical post에서 slug로 preview를 선택한다. 장식용 임시 카드라면 blog slug를 빌려 쓰지 않는다.                                  |

- 영향: 상세를 고쳐도 홈/서비스 카드가 갱신되지 않고, 같은 slug가 서로 다른 제목을 설명한다. 잘못된 링크·thin placeholder도 데이터가 늘수록 증가한다.
- 완료 조건:
  - portfolio slug별 엔터티 owner가 1개다.
  - 실적 수치와 기준일 owner가 1개다.
  - related/list 배열 안에 중복 slug가 없다.
  - 홈 blog preview의 제목·설명이 실제 연결 글과 일치한다.
  - 예상 감소량: portfolio 25~40줄, proof 20~25줄, blog 10~25줄.

### P2-2. 브레이크포인트는 숫자가 많아서가 아니라 역할이 기록되지 않아 뒤죽박죽이다

- 현재 분포:
  - 총 `@media` 86개
  - `max-width: 768px` 15개, `640px` 12개, `480px` 10개, `1080px` 10개, `1079px` 8개
  - 인접 family는 `639/640` 16개, `767/768` 17개, `1079/1080/1081` 19개다.
  - `1439/1440/min-1441`, `1023`, `900`, `720`, `560`, `479`도 존재한다.
- 중요한 판정:
  - `1079` 구조 변경과 `1080` Figma frame spacing은 역할이 다를 수 있다. 무조건 하나로 치환하면 1080px에서 의도한 1px seam을 없애며 레이아웃을 바꿀 수 있다.
  - `639/640`, `767/768`, `1439/1440/1441`도 같은 이유로 일괄 치환 대상이 아니다.
  - 반면 [`ProcessSection.module.css:212`](../../../apps/web/components/ProcessSection.module.css#L212)의 `max-width: 1080px`는 base [`ProcessSection.module.css:101`](../../../apps/web/components/ProcessSection.module.css#L101)의 `gap: 16px`를 그대로 반복한다. 이 media block 5줄은 즉시 삭제 가능하다.
  - [`service/mvp/page.module.css:202`](../../../apps/web/app/service/mvp/page.module.css#L202)의 유일한 `max-width: 1081px`는 `introCards` gap만 바꾼다. 실제 overflow 근거가 없다면 `1080px` 오타 가능성이 높다.

#### 권장 breakpoint 역할

| 역할              | 기본 경계                                           | 허용 변경                                         | 현재 예                                    |
| ----------------- | --------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| `layout tier`     | mobile `<=639`, tablet `640~1079`, desktop `>=1080` | columns, stack, display/order 같은 구조           | service grid, BusinessTypes, ProofMetrics  |
| `reference frame` | `<=640`, `<=1080`, 필요 시 `<=1440`                 | Figma 기준의 padding, gap, size 조정만            | app/mvp section spacing                    |
| `section compact` | `<=768`                                             | `SectionShell` padding, heading size, section gap | SectionShell과 섹션 소비자                 |
| `component fit`   | `1023`, `900`, `720`, `560`, `480/479`, `1439` 등   | 해당 컴포넌트가 실제로 넘치는 지점의 로컬 구조    | Header, FAQ nav, logo banner, contact form |

- 최소 수정안:
  1. `design.md`에 위 네 역할과 naming comment 규칙을 기록한다. 현재 빌드에 custom media 도구가 없으므로 숫자를 JS 상수나 새 의존성으로 억지 중앙화하지 않는다.
  2. 완전 중복인 Process media를 삭제한다.
  3. `1081px`은 1079/1080/1081/1082에서 실제 overflow를 확인해 1080으로 정규화하거나, 1081이어야 하는 측정 근거를 주석으로 남긴다.
  4. 이후 새 query는 “구조 tier인지, reference spacing인지, component fit인지”가 PR에서 설명될 때만 추가한다.
  5. `CardCarousel`처럼 부모 폭이 진짜 기준인 컴포넌트만 스냅샷 확보 후 container query pilot 후보로 삼는다. 전면 변환은 하지 않는다.
- 완료 조건:
  - base 선언과 동일한 media 선언이 0개다.
  - 설명 없는 `1081px` query가 0개다.
  - reference query에는 spacing/size만, layout tier에는 structure만 남는다.
  - component-fit 경계는 공통 token으로 강제하지 않고 해당 컴포넌트 옆에 이유가 남는다.
  - 한 theme switcher 선택과 Process block 삭제 후 media 수가 최소 83개 이하가 된다.

#### 경계값 검증 매트릭스

| family           | 확인 폭                      | 확인할 것                                                     |
| ---------------- | ---------------------------- | ------------------------------------------------------------- |
| `639/640`        | 638, 639, 640, 641           | 열 수, stack 여부, padding/gap                                |
| `767/768`        | 766, 767, 768, 769           | section compact와 내부 component 구조가 독립적으로 전환되는지 |
| `1079/1080/1081` | 1078, 1079, 1080, 1081, 1082 | grid columns, overflow, gap의 1px seam                        |
| `1439/1440/1441` | 1438, 1439, 1440, 1441, 1442 | contact 구조, service spacing, Process arrow 표시             |

변경 전후 같은 폭의 screenshot과 computed `display/grid-template-columns/gap/padding/font-size`를 비교한다. 애니메이션 컴포넌트는 `prefers-reduced-motion`도 별도로 확인한다.

### P2-3. 런타임 consumer가 없는 코드·자산과 공개 demo route가 남아 있다

- 아이콘:
  - [`components/icons.tsx`](../../../apps/web/components/icons.tsx#L1)는 550줄이다. 제품 import는 [`Icon.tsx:2`](../../../apps/web/components/Icon.tsx#L2)의 saved arrow 10개뿐이고, 그 10개 `IconName`은 제품 consumer가 없다.
  - `arrow-left`, `check`, `pen-tool-03`도 registry에는 있으나 제품 consumer가 없다.
  - 최소 수정: 사용하지 않는 saved arrow import/type/map과 세 inline renderer를 제거하고 `icons.tsx`를 삭제한다. 이 파일을 helper/gallery로 기록한 [`design.md:105`](../../../design.md#L105)도 실제 구조에 맞게 고친다. public Figma 원본 85개는 `design.md`가 원본 보존을 요구하므로 이 작업에 묶어 삭제하지 않는다.
  - 확인된 감소량: `icons.tsx`만 **550줄**, registry cleanup을 합치면 약 620~660줄.
- HOC:
  - [`withGlass.tsx`](../../../apps/web/components/withGlass.tsx#L1)는 58줄이며 import consumer가 0개다. 예시 주석만 있다.
  - 최소 수정: 파일 삭제. 감소량 **58줄**.
- 상세 CTA:
  - [`BlogDetailCtaButton.tsx`](../../../apps/web/app/blog/%5Bslug%5D/BlogDetailCtaButton.tsx#L1)과 [`PortfolioDetailCtaButton.tsx`](../../../apps/web/app/portfolio/%5Bslug%5D/PortfolioDetailCtaButton.tsx#L1)은 export 이름 외에 완전히 같다.
  - 최소 수정: `components/DetailCtaButton.tsx` 하나로 이동한다. 감소량 **28줄**.
- public starter assets:
  - `public/favicon.png`는 App Router가 쓰는 `app/icon.png`와 동일한 996-byte 파일이다. 그러나 현재 보조 검증뿐 아니라 [`organization-json-ld.md:85`](../../../apps/web/app/organization-json-ld.md#L85)가 이 이름을 언급하고, 이미 `/favicon.png` 공개 URL을 직접 요청하는 외부 consumer가 있을 수 있다. access/backward-compat 결정을 하기 전에는 즉시 삭제 대상으로 계산하지 않는다. 삭제한다면 문서·보조 검증을 함께 갱신하고 기존 URL 유지 필요를 먼저 확인한다.
  - `public/file-text.svg` 645 bytes와 `public/globe.svg` 2,878 bytes는 source consumer가 없다.
  - 큰 PNG 한 장과 위 미사용 starter SVG 두 개만 합친 즉시 감소량은 **4,157,845 bytes**다.
- font source:
  - [`app/fonts/GeistVF.woff`](../../../apps/web/app/fonts/GeistVF.woff)는 66,268 bytes, [`app/fonts/GeistMonoVF.woff`](../../../apps/web/app/fonts/GeistMonoVF.woff)는 67,864 bytes로 합계 **134,132 bytes**다. `@font-face`, `next/font`, import consumer는 없다.
  - 반면 실제 typography token은 [`design-system.css:2`](../../../design-system.css#L2)의 `Pretendard` system stack을 가리킨다. 저장소가 Pretendard를 직접 load하지도 않으므로, Geist를 바로 삭제하기보다 “Pretendard를 어떤 방식으로 보장할지, Geist fallback을 제품 폰트로 쓸지”를 디자인 담당자와 먼저 확정한다. Pretendard loading 정책이 정해지고 Geist 비사용이 확인되면 두 파일을 삭제한다.
- demo route:
  - [`app/liquid-glass/page.tsx`](../../../apps/web/app/liquid-glass/page.tsx#L1), switcher, CSS는 합계 525 product LOC다. [`app/color/page.tsx`](../../../apps/web/app/color/page.tsx#L1)와 CSS는 197 product LOC다.
  - 두 경로가 공개 제품 요구가 아니라 내부 실험/토큰 확인용이면 production app에서 삭제하거나 별도 개발 도구로 옮긴다. 합계 **722 product LOC**다. 사용자가 bookmark한 QA 도구인지 확인 전에는 자동 삭제하지 않는다.
- 완료 조건:
  - 삭제 대상마다 `rg` import/URL consumer가 0임을 다시 확인한다.
  - `design.md`가 존재하지 않는 icon helper를 가리키지 않는다.
  - favicon 공개 URL과 font family 결정이 필요한 자산은 access/디자인 승인 전 삭제하지 않는다.
  - 내부 도구를 유지한다면 공개 route가 아니라는 제품·배포 경계가 명확하다.

### P2-4. 공통 컴포넌트 기본값과 디자인 토큰을 소비자가 다시 선언한다

- `SectionShell`:
  - 기본값은 [`SectionShell.module.css:5`](../../../apps/web/components/SectionShell.module.css#L5), [`SectionShell.module.css:13`](../../../apps/web/components/SectionShell.module.css#L13), [`SectionShell.module.css:62`](../../../apps/web/components/SectionShell.module.css#L62), [`SectionShell.module.css:83`](../../../apps/web/components/SectionShell.module.css#L83)에 있다.
  - 그런데 [`ServicePortfolioSection.module.css:2`](../../../apps/web/components/ServicePortfolioSection.module.css#L2), [`service/mvp/page.module.css:64`](../../../apps/web/app/service/mvp/page.module.css#L64), [`service/app/page.module.css:197`](../../../apps/web/app/service/app/page.module.css#L197), [`service/company-homepage/page.module.css:303`](../../../apps/web/app/service/company-homepage/page.module.css#L303), [`page.module.css:196`](../../../apps/web/app/page.module.css#L196) 등이 fallback과 같은 값을 다시 쓴다.
  - 정확히 fallback과 같은 선언 최소 46줄은 삭제한다. `32px` mobile line-height, 홈의 `156px/108px` padding, app 설명 `14/21`, company SEO mobile `28/36`처럼 실제 override는 보존한다.
- Process section header:
  - [`ProcessSection.tsx:66`](../../../apps/web/components/ProcessSection.tsx#L66)~[`ProcessSection.tsx:83`](../../../apps/web/components/ProcessSection.tsx#L83)은 [`SectionShell.tsx:23`](../../../apps/web/components/SectionShell.tsx#L23)~[`SectionShell.tsx:40`](../../../apps/web/components/SectionShell.tsx#L40)의 section/inner/header/kicker/title/description 구조를 다시 쓴다.
  - CSS도 `.header`, `.heading`, `.orderChip` 선언이 [`ProcessSection.module.css:16`](../../../apps/web/components/ProcessSection.module.css#L16)과 [`SectionShell.module.css:16`](../../../apps/web/components/SectionShell.module.css#L16)에서 완전히 같고, 나머지 header style도 거의 같다.
  - 최소 수정: 별도 `SectionHeader` 추상화를 하나 더 만들지 말고 `ProcessSection`이 기존 `SectionShell`을 사용하게 한다. 비대칭 top/bottom padding과 rail/CTA만 Process CSS에 남긴다. 가능하면 CTA click만 client leaf로 분리한 뒤 진행한다.
  - 완료 조건: order chip/header markup과 공통 header CSS owner가 `SectionShell` 한 곳이고, 390/768/1080/1440에서 Process의 padding·줄바꿈·CTA 위치가 같다. 예상 감소량은 CSS 약 55~65줄과 TSX 약 8~12줄이며 client boundary 조정이 있어 조건부다.
- gradient Button:
  - gradient 사용처 7개 모두 `borderRadius: 32`, `padding: "8px 20px"`를 반복한다. 근거는 [`Header.tsx:30`](../../../apps/web/components/Header.tsx#L30), [`BottomCtaBanner.tsx:28`](../../../apps/web/components/BottomCtaBanner.tsx#L28), [`VideoBanner.tsx:40`](../../../apps/web/components/VideoBanner.tsx#L40), [`contact/page.tsx:52`](../../../apps/web/app/contact/page.tsx#L52), 두 detail CTA다.
  - [`button.tsx:75`](../../../packages/ui/src/button.tsx#L75)의 gradient base가 두 값을 소유하게 하고 width만 consumer에 남긴다. 확인된 선언 감소량 최소 **12줄**.
- Radio style injection:
  - [`radio.tsx:57`](../../../packages/ui/src/radio.tsx#L57)의 CSS 문자열을 각 instance가 [`radio.tsx:124`](../../../packages/ui/src/radio.tsx#L124)에서 `<style>`로 출력한다.
  - Contact는 Radio 3개를 렌더하므로 같은 약 478-character CSS와 style node가 SSR HTML에 세 번 들어간다. CSS module 한 번으로 옮긴다. source LOC 절감보다 instance당 중복 HTML 제거가 목적이다.
- token/typography 위반:
  - 실제 소비 UI 파일인 `button.tsx`, `search-input.tsx`, `checkbox.tsx`, `radio.tsx`에 기존 palette와 같은 raw hex가 반복된다. 기존 `--color-*` token으로 바꾼다.
  - [`company-homepage/page.module.css:43`](../../../apps/web/app/service/company-homepage/page.module.css#L43)은 typography를 로컬 font 선언으로 다시 만든다. `pretendard-bold-18`, `pretendard-medium-14`를 compose한다.
  - [`Icon.tsx:500`](../../../apps/web/components/Icon.tsx#L500)의 camera/webcam은 `#1B1F2A`를 고정하고 공통 `size/className/color` props도 버린다. `currentColor`와 공통 props를 사용한다.
- 완료 조건:
  - SectionShell 기본값과 같은 소비자 custom property 선언이 0개다.
  - 모든 gradient Button이 local radius/padding 없이 같은 computed style을 갖는다.
  - Radio CSS가 document에 한 번만 포함된다.
  - 기존 token과 정확히 같은 raw hex, 로컬 typography 재정의, 고정색 product icon이 사라진다.

### P2-5. 마케팅 공통 셸과 action 설정이 페이지마다 반복된다

- Header/Footer:
  - Home, About, Blog list/detail, Contact, FAQ, Portfolio list/detail, 서비스 3개 등 11개 페이지가 `<Header />`, fixed header layer, `<Footer />`를 직접 반복한다.
  - 일부는 [`portfolio/page.tsx:9`](../../../apps/web/app/portfolio/page.tsx#L9)처럼 홈 `page.module.css`를 cross-import해 header layer를 빌린다.
  - 최소 수정: wrapper 컴포넌트를 새로 만들지 말고 App Router의 `(marketing)/layout.tsx`를 사용한다. `/color`, `/liquid-glass`, `/api`, root document는 밖에 둔다. URL은 route group으로 바뀌지 않는다.
  - 예상 감소량: TSX 45~60줄, CSS 34~40줄. 파일 이동과 metadata nesting 확인이 필요하므로 조건부다.
- CTA action config:
  - About/MVP/App/기업 홈페이지/FAQ의 Bottom CTA 5곳은 `{ icon: "message-typing", id: "quick", title: "무료 상담 신청하기", variant: "yellow" }`를 정확히 반복한다. 같은 base object에 `width: 200`만 더한 VideoBanner action도 About과 서비스 3곳에 반복된다.
  - href의 기존 owner는 이미 [`cta-events.ts:1`](../../../apps/web/components/cta-events.ts#L1)의 `CtaAction`과 [`cta-events.ts:9`](../../../apps/web/components/cta-events.ts#L9)의 `ctaHrefs`다. 별도 `cta-actions.ts`를 만들어 두 번째 owner를 만들지 않는다.
  - 정확히 같은 quick action metadata가 제품 전역 의미로 확정되면 기존 `cta-events.ts`의 typed 의미 모델을 작게 확장한다. 화면별 문구가 다른 `cases` action과 width/layout은 route에 남긴다. 같은 route 안에서만 반복되는 값은 route-local const로 충분하다.
  - 예상 감소량: 검증된 exact quick object 범위에서 약 20~30줄. label까지 전역 규칙이라는 제품 합의 전에는 더 넓히지 않는다.
- 완료 조건:
  - 마케팅 page 안의 Header/Footer 렌더가 0개다.
  - CTA의 같은 semantic action은 href owner를 중복 생성하지 않고, 정확히 동일하다고 승인된 metadata만 기존 의미 모델 또는 route-local const를 쓴다.
  - route metadata, stacking, 내부 이동 시 Header 유지가 기존 의도와 맞는다.

## 지금 공통화하지 말아야 할 것

- [`glassFilter.ts`](../../../apps/web/components/glassFilter.ts#L1)와 [`liquidGlassFilter.ts`](../../../apps/web/components/liquidGlassFilter.ts#L1)는 하나는 generated normal map, 하나는 recut displacement map으로 알고리즘과 계약이 다르다. 이름이 비슷해도 합치지 않는다.
- Header와 switcher의 glass material 일부가 닮았다는 이유만으로 범용 `GlassEngine`을 만들지 않는다. 먼저 중복 switcher 하나를 삭제한다.
- 홈 rolling partner logo와 `ProofPartnerLogoBanner`는 motion·selection 계약이 다르다. 세 번째 같은 consumer가 생기기 전에는 합치지 않는다.
- 일반적인 `display:flex`, `align-items`, card radius의 반복은 component API가 아니다. utility class를 양산하지 않는다.
- portfolio card UI는 canonical data 통합과 before/after snapshot 뒤에만 공통화를 검토한다. 데이터 문제와 UI 추상화를 한 PR에 섞지 않는다.
- `CardCarousel`은 이미 네 곳에서 재사용된다. 새 carousel wrapper를 만들지 말고 필요한 경우 이 컴포넌트만 개선한다.

## 삭제·축소 효과

### 제품 결정 없이 진행 가능한 낮은 위험

| 작업                                            |                               확인된 효과 |
| ----------------------------------------------- | ----------------------------------------: |
| byte-identical PNG 1개 + 미사용 starter SVG 2개 |                           4,157,845 bytes |
| 미사용 `withGlass.tsx`                          |                                    58 LOC |
| 동일 detail CTA 통합                            |                                    28 LOC |
| SectionShell fallback 재선언                    |                           최소 46 CSS LOC |
| gradient radius/padding 재선언                  |                               최소 12 LOC |
| Process의 동일 media block                      |                      5 CSS LOC, media 1개 |
| 합계                                            | **최소 149 source LOC + 4,157,845 bytes** |

### 확인 또는 제품 결정 후 진행

| 작업                                     |                                           예상 효과 | 선행 조건                                                         |
| ---------------------------------------- | --------------------------------------------------: | ----------------------------------------------------------------- |
| theme switcher 하나 선택                 | 414~433 product LOC + 보조 검증 79~80줄 + media 2개 | compact/wide 제품 선택                                            |
| dead icon gallery/registry 정리          |                                      약 620~660 LOC | `design.md` 동시 갱신                                             |
| FAQ/portfolio/proof/blog/CTA 데이터 통합 |                                      약 165~230 LOC | canonical 문구와 표시 차이 승인                                   |
| Process가 기존 SectionShell 사용         |                                        약 63~77 LOC | client leaf와 비대칭 padding 회귀 확인                            |
| 동일 `public/favicon.png` 삭제           |                                           996 bytes | 공개 URL access/backward compatibility와 문서·보조 검증 갱신 결정 |
| 미사용 Geist font source 2개 삭제        |                                       134,132 bytes | Pretendard 실제 loading 방식과 제품 font family 확정              |
| 내부 `/liquid-glass`, `/color` 제거      |                                     722 product LOC | 공개 제품/QA route가 아님을 확인                                  |
| marketing route layout                   |                                       약 79~100 LOC | metadata와 stacking 회귀 확인                                     |

수치는 서로 겹치는 라인을 중복 합산하지 않은 보수적 범위다. CSS material 공통화, portfolio card 통합처럼 visual contract 확인이 필요한 후보는 효과 합계에 넣지 않았다.

## 권장 실행 순서

1. 공식 회사 facts와 전화번호를 확정한다.
2. compact/wide 테마 스위처 중 하나를 선택하고 전역 dataset writer를 하나로 만든다.
3. byte-identical asset, `withGlass`, detail CTA, Process 동일 media처럼 판단이 필요 없는 항목을 삭제한다.
4. FAQ → company proof → portfolio → blog preview 순서로 canonical data owner를 만든다. 한 PR에 한 도메인만 다룬다.
5. SectionShell fallback, Button gradient defaults, Radio CSS, raw token/typography를 정리한다.
6. breakpoint 역할을 `design.md`에 기록하고 경계값 매트릭스로 확인한다.
7. 마지막에 route group, dev route 제거, container query pilot처럼 영향 범위가 큰 조건부 변경을 진행한다.

## 최종 완료 체크리스트

- [ ] 같은 회사 fact, FAQ ID, portfolio slug, proof metric의 owner가 각각 1개다.
- [ ] 홈의 선택된 theme UI와 `html[data-theme]`가 항상 일치한다.
- [ ] 동일 SHA의 4.15MB 배경 파일이 1개만 남는다.
- [ ] runtime consumer가 없는 source file과 public starter asset이 정리됐다.
- [ ] SectionShell 기본값을 consumer가 다시 쓰지 않는다.
- [ ] gradient Button과 Radio state style의 소유권이 UI package 한 곳에 있다.
- [ ] `639/640`, `767/768`, `1079/1080/1081`, `1439/1440/1441` 경계를 전후 폭에서 확인했다.
- [ ] 모든 남은 breakpoint는 네 역할 중 하나로 설명된다.
- [ ] 유사하다는 이유만으로 glass/filter/card를 범용 추상화하지 않았다.
