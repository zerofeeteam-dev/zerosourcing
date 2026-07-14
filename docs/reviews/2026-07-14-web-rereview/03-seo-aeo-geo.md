# Web 재리뷰 — SEO / AEO / GEO / 의미 구조

- 리뷰 일자: 2026-07-14
- 범위: `apps/web`만 검토 (`admin` 제외)
- 방법: 저장소 정적 코드와 현재 Git 체크아웃만 검토. 외부 검색, 실서비스 접속, Search Console, 크롤러 로그 검증은 하지 않음.
- 판정 기준: 검색엔진이 URL과 엔터티를 일관되게 이해하는지, 답변 엔진이 공개 근거를 인용할 수 있는지, 사람이 접근 가능한 의미 구조인지

## Verification

- 루트 리뷰어가 production build(`pnpm --filter web build`)의 렌더된 head를 확인했다. `/color`는 홈 title과 `https://zerosourcing.kr/` canonical을, `/liquid-glass`는 고유 title과 `https://zerosourcing.kr/` canonical을 출력했다.

## 결론

기술적 SEO의 뼈대는 이전보다 분명히 좋아졌다. 핵심 공개 라우트에는 고유 title/description/canonical이 있고, 동적 상세 metadata, robots, sitemap, Organization JSON-LD도 마련됐다. 스키마를 무작정 늘리지 않고 확인되지 않은 `logo`, 최상위 `sameAs`, `telephone`을 제외한 판단도 적절하다.

그러나 현재 상태를 “검색 공개 준비 완료”라고 보기는 어렵다. 가장 큰 문제는 메타태그 개수가 아니라 공개 콘텐츠의 신뢰성이다.

1. 미래 날짜와 `<p>HTML</p>`만 가진 블로그 6건이 sitemap에 포함되어 있다.
2. 회사소개 전화번호와 Footer 전화번호가 서로 다르며 하나는 명백한 placeholder다.
3. 디자인/실험 라우트가 전체 허용 robots 아래 공개되어 있고, 포트폴리오 상세도 placeholder를 노출한다.

따라서 판정은 **조건부 보류**다. P0 두 건을 고치기 전에는 현재 sitemap 제출이나 블로그 상세 URL의 검색 노출 확대를 권하지 않는다.

## 개선된 점

- [`site-metadata.ts`](../../../apps/web/app/site-metadata.ts#L3)은 canonical 도메인, OG, Twitter Card를 한 helper에서 관리한다. 핵심 정적 페이지도 각각 자기 경로를 canonical로 사용한다.
- [`blog/[slug]/page.tsx`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L23)와 [`portfolio/[slug]/page.tsx`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L20)는 route data로 상세 metadata를 만든다.
- [`robots.ts`](../../../apps/web/app/robots.ts#L5)와 [`sitemap.ts`](../../../apps/web/app/sitemap.ts#L19)가 생겼고, sitemap은 핵심 정적 라우트와 동적 상세 URL을 데이터에서 생성한다.
- [`layout.tsx`](../../../apps/web/app/layout.tsx#L13)는 `metadataBase`, `lang="ko"`, 안전하게 직렬화한 Organization JSON-LD를 제공한다.
- [`organization-json-ld.json`](../../../apps/web/app/organization-json-ld.json#L1)은 파싱 가능한 별도 원본이고, [`organization-json-ld.md`](../../../apps/web/app/organization-json-ld.md#L80)는 확인되지 않은 속성을 왜 제외했는지 기록한다. 스키마 남발보다 훨씬 안전한 방향이다.
- FAQ는 [`faq/page.tsx`](../../../apps/web/app/faq/page.tsx#L223)의 `section`/`h2`와 native `details`/`summary`를 사용한다. 회사 정보는 [`about/page.tsx`](../../../apps/web/app/about/page.tsx#L197)의 `dl`/`dt`/`dd`, 문의 폼은 연결된 label과 `aria-live`를 사용한다.
- 주요 랜딩 페이지는 공통 [`VideoBanner.tsx`](../../../apps/web/components/VideoBanner.tsx#L55)에서 하나의 `h1`을 만들고 이후 섹션 제목을 `h2`로 구성한다.
- OG 이미지는 실제 1200×800 PNG다. 메타데이터에 선언한 크기와 파일이 일치한다.

## 남은 문제

### P0-1. 빈 블로그 6건이 미래 날짜로 검색 공개된다

- 근거: [`blog-posts.ts:13`](../../../apps/web/app/blog/blog-posts.ts#L13), [`blog-posts.ts:17`](../../../apps/web/app/blog/blog-posts.ts#L17), [`blog-posts.ts:18`](../../../apps/web/app/blog/blog-posts.ts#L18), [`blog/[slug]/page.tsx:115`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L115), [`sitemap.ts:22`](../../../apps/web/app/sitemap.ts#L22)
- 관찰: 6개 글의 본문이 모두 `<p>HTML</p>`이며 게시일은 현재 리뷰 일자보다 뒤인 `2026. 11. 02`다. 그런데 모든 글이 정적 경로와 sitemap에 포함된다.
- 검색/답변엔진 영향: 제목·description과 실제 본문이 일치하지 않는 thin placeholder URL로 평가될 수 있다. 답변 엔진이 인용할 근거가 없고, 정부지원사업·비용 같은 민감한 주제의 신뢰도도 떨어뜨린다.
- 최소 수정안: 실제 본문과 확정된 게시일이 없는 record에 `status: "draft"`를 두고 목록, `generateStaticParams`, sitemap에서 제외한다. 급하면 상세 URL을 `notFound()` 처리하거나 `noindex`하고, 완성된 글만 한 건씩 공개한다.
- 완료 조건:
  - sitemap의 모든 `/blog/*` URL에 제목을 실제로 답하는 고유 본문이 있다.
  - literal `<p>HTML</p>`과 미래 placeholder 날짜가 없다.
  - 공개일은 ISO 값으로 관리되고, 작성/검토 주체와 사실 근거가 화면에 보인다.
  - 정부지원사업처럼 변할 수 있는 내용은 기준일과 공식 출처를 명시한다.

### P0-2. 공개 전화번호가 서로 충돌한다

- 근거: [`about/content.ts:78`](../../../apps/web/app/about/content.ts#L78), [`about/content.ts:88`](../../../apps/web/app/about/content.ts#L88), [`Footer.tsx:7`](../../../apps/web/components/Footer.tsx#L7), [`Footer.tsx:9`](../../../apps/web/components/Footer.tsx#L9), [`organization-json-ld.md:86`](../../../apps/web/app/organization-json-ld.md#L86)
- 관찰: 회사소개는 `02-1234-5678`, Footer는 `010-3242-8118`이다. JSON-LD 문서는 임시 전화번호 때문에 `telephone`을 제외했다고 명시한다.
- 검색/답변엔진 영향: NAP 불일치는 조직 엔터티 결합과 로컬/브랜드 신뢰를 훼손한다. 더 직접적으로는 사용자가 잘못된 번호로 연락할 수 있다.
- 최소 수정안: **확인 필요 — 공식 대표번호와 고객센터 번호의 의미를 사업 담당자가 확정**한다. 번호가 하나면 단일 company facts 원본에서 About, Footer, JSON-LD를 파생한다. 검증된 번호가 없다면 About의 placeholder를 즉시 삭제하고 JSON-LD에도 넣지 않는다.
- 완료 조건:
  - `02-1234-5678`이 저장소와 렌더 결과에서 사라진다.
  - 서로 다른 번호를 유지한다면 각각 `대표번호`/`고객센터`처럼 목적이 명확하다.
  - Organization `telephone`은 검증된 공식 번호가 있을 때만 화면과 동일하게 추가된다.

### P1-1. 내부 디자인/실험 라우트가 indexable 상태다

- 근거: [`robots.ts:7`](../../../apps/web/app/robots.ts#L7), [`color/page.tsx:96`](../../../apps/web/app/color/page.tsx#L96), [`liquid-glass/page.tsx:6`](../../../apps/web/app/liquid-glass/page.tsx#L6), [`liquid-glass/page.tsx:17`](../../../apps/web/app/liquid-glass/page.tsx#L17)
- 관찰: robots는 `*`에 `/` 전체를 허용한다. `/color`는 별도 metadata가 없고, `/liquid-glass`는 title/description만 있으며 Latin placeholder 본문을 공개한다. production build HTML에서 `/color`는 홈 title + 홈 canonical, `/liquid-glass`는 고유 title + 홈 canonical을 출력하는 것이 확인됐다. sitemap 제외만으로 색인은 차단되지 않는다.
- 검색/답변엔진 영향: 브랜드 사이트에 디자인 토큰 페이지와 Lorem ipsum 실험 페이지가 섞여 crawl budget과 사이트 품질 신호를 낭비한다. 두 별도 URL이 홈을 canonical로 선언해 URL별 목적과 색인 신호도 충돌한다.
- 최소 수정안: 가장 안전한 선택은 production route에서 제거하거나 개발 환경에서만 노출하는 것이다. 유지해야 한다면 두 페이지에 명시적인 `robots: { index: false, follow: false }`와 홈이 아닌 자기 canonical을 설정한다.
- 완료 조건: production에서 두 URL이 404/비공개이거나, production build의 렌더된 head에 `noindex`가 있고 canonical이 각각 자기 URL이며 sitemap에도 없다. 홈 title/canonical이 두 URL에 더 이상 출력되지 않는다.

### P1-2. 포트폴리오 상세 9건이 placeholder를 포함한 채 sitemap에 들어간다

- 근거: [`portfolio/[slug]/page.tsx:51`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L51), [`portfolio/[slug]/page.tsx:99`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L99), [`portfolio-items.ts:77`](../../../apps/web/app/portfolio/portfolio-items.ts#L77), [`sitemap.ts:23`](../../../apps/web/app/sitemap.ts#L23)
- 관찰: 상세마다 견적·기간·기능은 있지만 본문/결과 화면 자리는 모두 `HTML` 한 단어다. 목록 metadata는 “실제 제작 사례”라고 설명한다.
- 검색/답변엔진 영향: 사례의 문제, 작업, 결과, 검증 근거가 없어 고유성이 약하고 잠재 고객이나 답변 엔진이 실적을 검증하기 어렵다.
- 최소 수정안: 고객 공개 동의를 받은 사례만 `published`로 분리한다. 각 공개 상세에 최소한 문제/제약, 담당 범위, 해결 과정, 결과, 고객명 사용 승인 여부를 넣고 placeholder block을 제거한다. 준비되지 않은 상세는 목록 카드만 유지하고 상세 URL은 noindex/미생성한다.
- 완료 조건: sitemap의 모든 `/portfolio/*` URL에 고유 사례 본문과 실제 시각 자료 또는 명시적 결과 설명이 있고, literal `HTML`이 없다.

### P1-3. SEO/GEO 소개 화면이 다른 도메인과 보장성 표현을 노출한다

- 근거: [`service/company-homepage/page.tsx:143`](../../../apps/web/app/service/company-homepage/page.tsx#L143), [`service/company-homepage/page.tsx:166`](../../../apps/web/app/service/company-homepage/page.tsx#L166), [`service/company-homepage/page.tsx:185`](../../../apps/web/app/service/company-homepage/page.tsx#L185), [`service/company-homepage/page.tsx:190`](../../../apps/web/app/service/company-homepage/page.tsx#L190)
- 관찰: 공개 본문 안의 검색 예시는 canonical 도메인과 다른 `zerosourcing.com`을 사용한다. 또한 “상위에 노출되도록 만듭니다”, “ChatGPT·Claude가 회사를 인용하게”는 기술 세팅만으로 보장할 수 없는 결과 표현이다.
- 검색/답변엔진 영향: `.kr`과 `.com`이 같은 브랜드의 공식 사이트처럼 섞여 엔터티 신호가 흐려진다. 검증 불가능한 노출/인용 보장은 서비스 신뢰도와 향후 분쟁 위험을 높인다.
- 최소 수정안: 예시 도메인을 명백한 가상 도메인으로 표시하거나 실제 canonical `.kr`로 통일한다. 문구는 “검색엔진이 이해하고 수집할 수 있는 기반을 구성”, “AI 답변에 활용될 수 있도록 명확한 근거 구조를 제공”처럼 통제 가능한 산출물로 제한한다.
- 완료 조건: 공개 본문에 `zerosourcing.com`이 없고, 순위·언급·인용을 보장하는 표현이 없다. 제공 범위와 보장하지 않는 결과가 구분된다.

### P1-4. 개인정보·이용약관 텍스트가 링크나 실제 정책으로 연결되지 않는다

- 근거: [`Footer.tsx:27`](../../../apps/web/components/Footer.tsx#L27), [`Footer.tsx:28`](../../../apps/web/components/Footer.tsx#L28), [`Footer.tsx:29`](../../../apps/web/components/Footer.tsx#L29), [`contact/page.tsx:260`](../../../apps/web/app/contact/page.tsx#L260), [`contact/page.tsx:268`](../../../apps/web/app/contact/page.tsx#L268)
- 관찰: Footer의 이용약관/개인정보처리방침은 `p`이고, 문의 폼의 개인정보 “보기” 버튼에는 동작이 없다. 반면 폼은 회사명, 이름, 이메일, 전화번호와 상담 내용을 수집한다.
- 검색/답변엔진 영향: 직접적인 ranking 요소라 단정할 수는 없지만, 조직의 투명성과 신뢰를 확인할 공개 근거가 없다. 키보드/보조기술 사용자도 정책을 열 수 없다.
- 최소 수정안: 법률 검토된 `/terms`, `/privacy` 또는 검증된 외부 정책 URL을 만들고 Footer와 폼에서 실제 `Link`로 연결한다. 공개 페이지라면 고유 metadata와 sitemap 항목도 추가한다.
- 완료 조건: 링크가 키보드로 작동하고, 동의 전에 수집 목적·항목·보유기간·처리 주체를 읽을 수 있다. **정책 내용의 적법성은 별도 법률 확인 필요**다.

### P1-5. Organization/회사 실적의 “코드 일치”는 검증했지만 “사실성”은 확인되지 않았다

- 근거: [`organization-json-ld.json:5`](../../../apps/web/app/organization-json-ld.json#L5), [`organization-json-ld.json:18`](../../../apps/web/app/organization-json-ld.json#L18), [`organization-json-ld.json:25`](../../../apps/web/app/organization-json-ld.json#L25), [`about/content.ts:78`](../../../apps/web/app/about/content.ts#L78), [`app/content.ts:24`](../../../apps/web/app/content.ts#L24), [`partner-logos.ts:7`](../../../apps/web/components/partner-logos.ts#L7)
- 관찰: 테스트는 JSON과 화면 copy의 일치 여부를 보장하지만 사업자 정보, founder, 주소, 이메일, 172건+, 재의뢰율 47.2%, 평균 4주, 영구 보장, 고객사 관계가 실제 증빙과 맞는지는 저장소만으로 확인할 수 없다. JSON-LD의 `founder`와 화면의 `대표자`는 개념도 다르다.
- 검색/답변엔진 영향: 구조화 데이터는 기존 공개 사실을 명확히 하는 수단이지 사실을 만들어 주지 않는다. 잘못된 실적·관계·인물 속성은 엔터티 신뢰를 오히려 해친다.
- 최소 수정안: **확인 필요 — 사업 담당자가 서명한 company facts sheet**를 만든다. 도메인, 법적 상호, 대표자, 창업자, 사업자/통신판매 번호, 주소, 이메일, 공식 전화, 고객사 사용 승인, 지표 산식·기준일, 보증 범위를 항목별로 승인하고 코드의 단일 원본에서 화면과 JSON-LD를 파생한다.
- 완료 조건: 각 구조화 속성과 수치에 내부 증빙/승인자/기준일이 있으며, founder가 단지 대표자라는 이유로 입력된 값이 아니다. 확인되지 않은 값은 schema와 마케팅 copy 양쪽에서 제외된다.

### P2-1. 같은 FAQ 질문이 두 원본에서 서로 다른 답변으로 관리된다

- 근거: [`faq/content.ts:205`](../../../apps/web/app/faq/content.ts#L205), [`faq/content.ts:212`](../../../apps/web/app/faq/content.ts#L212), [`service/app/content.ts:138`](../../../apps/web/app/service/app/content.ts#L138), [`service/app/content.ts:145`](../../../apps/web/app/service/app/content.ts#L145), [`faq/content.ts:233`](../../../apps/web/app/faq/content.ts#L233), [`service/company-homepage/content.ts:68`](../../../apps/web/app/service/company-homepage/content.ts#L68)
- 관찰: 질문 문구는 같지만 서비스 페이지 답변이 더 길거나 항목 수가 다르다. 현재 큰 모순은 아니지만 수정 시 한쪽만 바뀌기 쉽다.
- 검색/답변엔진 영향: 동일 질문에 대한 대표 답이 URL마다 달라져 답변 엔진이 어느 문장을 canonical answer로 볼지 불명확해진다.
- 최소 수정안: 질문과 핵심 답변을 stable ID가 있는 하나의 FAQ 원본으로 옮기고, `/faq`와 서비스 페이지가 선택해서 렌더한다. 화면별로 정말 다른 설명이 필요하면 질문 자체를 더 구체적으로 바꾼다.
- 완료 조건: 동일 질문은 하나의 승인된 핵심 답을 공유하거나, 맥락이 다른 질문으로 명시적으로 분리된다.

### P2-2. 실제 글을 공개한 뒤에는 Article 신호와 기계 판독 가능한 날짜가 필요하다

- 근거: [`site-metadata.ts:34`](../../../apps/web/app/site-metadata.ts#L34), [`site-metadata.ts:35`](../../../apps/web/app/site-metadata.ts#L35), [`blog/[slug]/page.tsx:23`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L23), [`blog/[slug]/page.tsx:46`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L46), [`blog/[slug]/page.tsx:57`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L57)
- 관찰: 공통 helper는 모든 페이지를 `openGraph.type = "website"`로 만든다. 날짜는 표시용 문자열뿐이고 `<time dateTime>`이 아니며 modified date와 작성/검토자 설명이 없다.
- 검색/답변엔진 영향: 실제 글이 생겨도 문서 유형, 발행/수정 시점, 책임 주체를 기계가 명확히 읽기 어렵다.
- 최소 수정안: P0-1을 먼저 해결한 뒤 `publishedAt`/`modifiedAt` ISO 필드를 추가하고 `<time dateTime>`으로 출력한다. 블로그 상세만 OG `article`과 일치하는 author/date를 제공한다. `BlogPosting` JSON-LD는 화면에 보이는 동일 정보가 준비된 경우에만 추가한다.
- 완료 조건: 공개 글의 visible date, metadata, 선택적으로 추가한 JSON-LD 날짜/작성자가 모두 일치한다. `lastModified`도 실제 변경일이 있을 때만 sitemap에 넣는다.

### P2-3. breadcrumb와 FAQ 카테고리 이동이 실제 링크가 아니다

- 근거: [`blog/[slug]/page.tsx:103`](../../../apps/web/app/blog/%5Bslug%5D/page.tsx#L103), [`portfolio/[slug]/page.tsx:56`](../../../apps/web/app/portfolio/%5Bslug%5D/page.tsx#L56), [`faq/page.tsx:134`](../../../apps/web/app/faq/page.tsx#L134), [`faq/page.tsx:167`](../../../apps/web/app/faq/page.tsx#L167), [`faq/page.tsx:225`](../../../apps/web/app/faq/page.tsx#L225)
- 관찰: 상세 breadcrumb는 `/`가 들어간 plain `p`이고, FAQ 카테고리는 ID가 있어도 `<button>`과 JS `scrollIntoView`로만 이동한다.
- 검색/답변엔진 영향: breadcrumb의 내부 링크/계층 신호를 잃고, FAQ의 개별 주제 URL을 복사하거나 JS 없이 직접 열기 어렵다. 접근성 면에서도 “이동” 동작은 링크 의미가 더 정확하다.
- 최소 수정안: 상세는 `<nav aria-label="breadcrumb"><ol>` 안에 홈/목록 `Link`와 현재 페이지를 둔다. FAQ 카테고리는 `href="#category-id"` 링크를 기본으로 하고 부드러운 스크롤은 enhancement로 남긴다.
- 완료 조건: 링크를 새 탭에서 열거나 URL을 복사할 수 있고, hash URL을 직접 열면 해당 섹션으로 이동하며, 키보드와 JS 비활성 상태에서도 동작한다.

### P2-4. AI 검색 크롤러 정책이 “전체 허용” 외에는 정의되지 않았다

- 근거: [`robots.ts:5`](../../../apps/web/app/robots.ts#L5), [`robots.ts:7`](../../../apps/web/app/robots.ts#L7), [`robots.ts:8`](../../../apps/web/app/robots.ts#L8)
- 관찰: 현재는 모든 user-agent에 `/`를 허용한다. 검색/답변용 수집과 모델 학습용 수집을 같은 정책으로 취급할지에 대한 제품 결정을 코드에서 알 수 없다.
- 검색/답변엔진 영향: 전체 허용이 의도라면 기술적 결함은 아니다. 그러나 조직의 데이터 사용 정책과 다르면 원치 않는 수집을 허용하거나, 반대로 추후 잘못된 blanket 차단으로 GEO 발견성을 잃을 수 있다. robots 허용 자체가 답변 노출을 보장하지도 않는다.
- 최소 수정안: **확인 필요 — 검색/답변 인용용 crawler와 학습용 crawler를 각각 허용할지 사업 정책을 결정**한다. 추가할 user-agent 이름과 지원 방식은 구현 시점의 각 공급자 공식 문서로 다시 확인한다. 현재 리뷰는 외부 문서를 조회하지 않았으므로 이름 목록을 고정 제안하지 않는다.
- 완료 조건: 승인된 crawler-policy 표와 생성된 robots가 일치하고, “전체 허용”도 의도된 결정으로 기록된다. `llms.txt`는 소비 주체와 운영 목적이 확인되기 전까지 만능 해결책처럼 추가하지 않는다.

### P2-5. 서비스 메뉴의 ARIA가 실제 popup 동작과 맞지 않는다

- 근거: [`Header.tsx:100`](../../../apps/web/components/Header.tsx#L100), [`Header.tsx:109`](../../../apps/web/components/Header.tsx#L109), [`Header.tsx:130`](../../../apps/web/components/Header.tsx#L130), [`Header.tsx:132`](../../../apps/web/components/Header.tsx#L132), [`Header.module.css:211`](../../../apps/web/components/Header.module.css#L211)
- 관찰: `Service`는 이동 가능한 링크이면서 `aria-haspopup="menu"`를 선언하지만 `aria-expanded`가 없고 popup은 menu role/키보드 menu pattern이 아니라 hover/focus-within 링크 묶음이다.
- 검색/답변엔진 영향: 서비스 링크 자체는 crawl 가능하므로 SEO 영향은 낮다. 다만 보조기술에는 존재하지 않는 menu widget을 예고해 공개 사이트의 접근 가능한 의미 구조를 약화한다.
- 최소 수정안: 단순 탐색 링크 묶음으로 유지한다면 `aria-haspopup`를 제거하고 보통의 nav/subnav로 표현한다. 실제 disclosure로 만들려면 별도 button, `aria-expanded`, `aria-controls`, Escape/포커스 동작을 함께 구현한다.
- 완료 조건: 선언한 ARIA pattern과 실제 키보드 동작이 일치하고, 모든 서비스 링크가 pointer 없이도 도달 가능하다.

## 구조화 데이터 판단

현재는 Organization + OfferCatalog만 유지하는 편이 맞다. 다음을 우선순위로 추가하지 않는다.

- `FAQPage`: native FAQ 의미 구조와 답변 일관성을 먼저 고친다. 검색 노출 혜택/자격은 구현 시점의 공식 정책을 확인한 뒤 판단한다.
- `WebSite`, `Service`, `LocalBusiness`: 속성 수를 늘리는 것 자체는 AEO/GEO 개선이 아니다. 확인된 화면 사실과 실제 검색 기능이 생길 때만 추가한다.
- `BlogPosting`, `BreadcrumbList`: 실제 본문·날짜·작성 책임과 링크 breadcrumb가 준비된 뒤, 화면과 1:1로 일치시킬 수 있을 때만 추가한다.
- meta keywords, 숨김 키워드, 대량 `knowsAbout`, schema 복제, `llms.txt` 단독 도입: 근거 콘텐츠를 대신하지 못한다.

## 권장 수정 순서

1. 블로그 draft를 검색/목록/sitemap에서 제외하고 공개 전화번호를 확정한다.
2. `/color`, `/liquid-glass`, 미완성 포트폴리오 상세의 production 노출을 차단한다.
3. `.com` 예시와 노출 보장 문구를 고치고, 실제 개인정보/이용약관 링크를 연결한다.
4. 승인된 company facts 원본과 FAQ 원본을 만든다.
5. 실제 블로그 콘텐츠를 공개하면서 Article 날짜/작성 책임, semantic breadcrumb를 추가한다.
6. 마지막으로 AI crawler 정책과 필요한 최소 schema만 결정한다.

## 최종 완료 기준

- sitemap에는 사용자가 읽을 수 있는 완성된 canonical URL만 있다.
- 공개 회사명·주소·이메일·전화·대표/창업자 정보가 화면과 JSON-LD에서 모순되지 않는다.
- 모든 숫자·보증·고객사 관계에 기준일과 내부 승인이 있다.
- 내부 실험 페이지와 placeholder 콘텐츠가 색인 대상이 아니다.
- FAQ의 동일 질문은 하나의 승인 답을 사용하고 hash deep-link가 작동한다.
- 실제 블로그 글은 기계 판독 가능한 발행/수정일과 작성 책임을 가진다.
- schema는 화면에 보이는 확인된 사실만 전달하며, 순위나 AI 인용을 보장한다고 표현하지 않는다.
