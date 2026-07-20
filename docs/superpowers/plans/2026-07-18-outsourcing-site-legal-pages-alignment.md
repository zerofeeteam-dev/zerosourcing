# 외주 문의 사이트 법률 문서 정합성 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디지털 콘텐츠 거래 플랫폼 기준으로 작성된 이용약관과 개인정보처리방침을 제로소싱의 실제 외주 개발 문의 사이트와 일치시키고, 문의 폼에서 이용자가 동의 내용을 제출 전에 확인할 수 있게 한다.

**Architecture:** 기존 `/term`, `/privacy` 경로와 문서 렌더러는 유지하고 각 `content.ts`의 정책 본문만 실제 서비스 기준으로 교체한다. 문의 폼은 새 모달 의존성을 만들지 않고 네이티브 `details/summary`로 수집·이용 및 국외 이전 고지를 펼쳐 보이게 하며, 서버는 두 필수 동의 값을 모두 검증한다. 앱 DB에는 문의를 저장하지 않고 Slack으로 전달하는 현재 흐름을 유지하되, Slack 보관 설정과 수탁·국외 이전 고지를 같은 기준으로 맞춘다.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript 5.9, CSS Modules, Node.js test runner, Vitest, Slack Web API, Vercel

## Global Constraints

- 사이트는 회원가입, 로그인, 디지털 콘텐츠 판매, 구독, 결제, 빌링키, 정산, 환불 기능을 제공하지 않는다.
- 사이트의 역할은 회사·서비스·포트폴리오·블로그·FAQ 정보 제공과 외주 개발 문의 접수다.
- 문의 제출만으로 개발 계약이 성립하지 않으며, 범위·일정·대금·검수·지식재산권·하자보수는 별도 견적서·업무범위서·개별 계약이 우선한다.
- 문의 폼의 필수 항목은 기업명, 담당자 성명, 이메일, 연락처, 선호 연락 방법, 예산이다.
- 추가 문의 내용은 선택 항목이며 필수 항목으로 표현하지 않는다.
- 문의 폼의 모든 입력값은 서버 함수에서 Slack 채널로 전달되며 앱 데이터베이스에는 저장하지 않는다.
- 문의 개인정보 보유기간은 접수일로부터 1년으로 통일하고 Slack 문의 채널에도 365일 보관 정책을 적용한다.
- Slack 또는 Vercel의 국내 저장을 입증하는 관리자 설정 자료가 없으면 미국으로의 국외 이전 사실을 공개한다.
- 현재 코드에 없는 맞춤형 광고, 마케팅 쿠키, 회원 탈퇴, 마이페이지, 결제·정산 처리 내용을 문서에 추가하지 않는다.
- 개인정보 수집·이용 동의와 국외 이전 동의는 목적·항목·보유기간·거부권 및 거부 시 불이익을 각각 제출 전에 표시한다.
- 회사 표기는 `제로피(제로소싱)`, 대표자 및 개인정보 보호책임자는 `이동규`, 이메일은 `contact@zerofee.kr`, 전화번호는 `010-3242-8118`로 통일한다.
- UI 변경 시 `design.md`에 따라 Pretendard 전역 타이포그래피 토큰, `var(--color-...)`, 부모 `gap`을 사용하고 새 아이콘과 새 UI 의존성을 만들지 않는다.
- 아래 문구는 기술·운영 사실을 기준으로 한 초안이며, 공개 배포 전에 국내 개인정보보호 법률 전문가가 최종 문안을 검토한다.

---

## 현재 구현과 실제 서비스의 차이

### 이용약관

| 현재 문서 | 실제 서비스 | 수정 방향 |
| --- | --- | --- |
| 디지털 콘텐츠 거래·구독 플랫폼을 서비스 목적으로 정의 | MVP·앱·홈페이지 외주 개발 정보 및 상담 문의 사이트 | 목적과 서비스 범위를 사이트 정보 열람·문의 접수로 전면 교체 |
| 회원, 구매자, 크리에이터, 카카오 로그인 계정을 정의 | 공개 사이트이며 회원·로그인 기능이 없음 | 계정·회원 조항 삭제, `이용자`, `문의 서비스`, `개별 계약`만 정의 |
| 일반 상품, 구독 상품, 링크 페이, 빌링키, 플랜을 정의 | 상품 판매·구독·자동결제가 없음 | 결제 관련 용어와 전 조항 삭제 |
| 콘텐츠 제공, 청약철회, 환불 규정 | 개발 결과물과 대금 조건은 프로젝트마다 다름 | 사이트 약관에는 넣지 않고 개별 계약 우선 원칙 명시 |
| 크리에이터 정산·세금·차지백 규정 | 판매자 정산 기능 없음 | 전부 삭제 |
| 플랫폼은 거래 당사자가 아니라는 중개 면책 | 제로소싱이 외주 계약의 직접 당사자가 될 수 있음 | 중개 면책 삭제, 사이트 이용과 개별 개발 계약의 책임을 분리 |
| 탈퇴·이용정지·계정관리 절차 | 계정 자체가 없음 | 삭제 |
| 서비스 내 공지사항과 이메일로 약관 개정 고지 | 별도 공지사항 기능 없음 | 사이트 게시 방식과 시행일 고지로 변경 |

### 개인정보처리방침

| 현재 문서 | 실제 서비스 | 수정 방향 |
| --- | --- | --- |
| 이름·이메일·휴대폰·닉네임·빌링키·계좌·사업자정보 수집 | 기업명·담당자명·이메일·전화·연락 방법·예산, 선택 문의 내용 수집 | 실제 폼 필드와 필수·선택 구분을 그대로 기재 |
| 카카오 로그인, 회원관리, 연령확인 | 로그인과 회원 기능 없음 | 삭제 |
| 결제·환불·정산·세금계산서·마케팅 목적 | 상담 접수·연락·요구사항/예산 검토·견적 준비가 목적 | 실제 문의 처리 목적으로 교체 |
| 크리에이터, 토스페이먼츠, 링크허브, 국세청에 제3자 제공 | 현재 문의는 Slack API로 전달되고 앱 DB에 저장되지 않음 | 제3자 제공 `없음`과 처리위탁을 구분하고 Slack·Vercel 공개 |
| Bubble·AWS·Toss·LinkHub를 수탁자로 기재 | 현재 웹은 Vercel에서 실행되고 문의는 Slack으로 전달 | 실제 수탁자와 처리 업무만 기재 |
| 회원 탈퇴 후 파기, 마이페이지에서 열람·삭제 | 회원·마이페이지가 없음 | 접수 후 1년 보관, 이메일·전화로 권리 행사하도록 변경 |
| 맞춤형 마케팅 쿠키와 구형 브라우저 설정 안내 | 현재 코드에서 광고·분석 쿠키가 확인되지 않음 | 마케팅 쿠키 문구 삭제; Google 지도 사용 시 제3자 기술정보 처리만 조건부 안내 |
| 문의 폼의 `보기` 버튼이 아무 동작도 하지 않음 | 필수 동의를 받지만 사전 고지 내용을 볼 수 없음 | 제출 전 펼쳐보는 수집·이용 및 국외 이전 고지 구현 |
| 문의 데이터 국외 이전 설명이 실제 처리와 다름 | Slack과 Vercel이 미국에서 처리할 가능성이 높음 | 이전 국가·시점·방법·항목·목적·보유기간·거부권 공개 |

## File Map

| 경로 | 책임 |
| --- | --- |
| `docs/privacy/inquiry-data-handling.md` | 실제 데이터 흐름, 수탁자, 보관기간, 삭제·권리행사 절차의 운영 기준 |
| `apps/web/app/term/content.ts` | 외주 문의 사이트 이용약관의 단일 본문 소스 |
| `apps/web/app/term/page.tsx` | 이용약관 제목, 메타데이터, 기존 문서 렌더링 |
| `apps/web/app/term/page.test.mjs` | 사이트 약관에 필요한 조항과 금지된 옛 플랫폼 용어 회귀검사 |
| `apps/web/app/privacy/content.ts` | 문의 개인정보 수집·이용·위탁·국외 이전·권리행사 본문 |
| `apps/web/app/privacy/page.tsx` | 개인정보처리방침 메타데이터와 기존 문서 렌더링 |
| `apps/web/app/privacy/page.test.mjs` | 실제 필드·수탁자·보유기간과 금지된 옛 서비스 용어 회귀검사 |
| `apps/web/app/contact/page.tsx` | 두 동의값 제출 및 네이티브 펼침 고지 UI |
| `apps/web/app/contact/page.module.css` | 고지 UI의 디자인 시스템 기반 레이아웃·포커스 스타일 |
| `apps/web/app/contact/contact-privacy-consent.test.mjs` | 문의 폼의 필수·선택 구분, 고지 내용, 두 동의값 검사 |
| `apps/web/app/api/contact/route.ts` | 수집·이용 및 국외 이전 동의의 서버 측 필수 검증 |
| `apps/web/app/site-metadata.test.mjs` | 두 법률 페이지의 서비스 정합적 메타데이터 회귀검사 |

새 공용 추상화나 법률 문서 CMS는 만들지 않는다. 현재 두 문서의 데이터 구조가 렌더러와 분리돼 있어 본문 교체만으로 충분하다.

---

### Task 1: 문의 개인정보 처리 운영 기준 확정

**Files:**
- Create: `docs/privacy/inquiry-data-handling.md`

**Interfaces:**
- Consumes: `POST /api/contact`의 현재 요청 필드와 Slack `chat.postMessage` 전달 구조
- Produces: 이용약관·처리방침·동의 UI가 함께 따르는 365일 보관 및 삭제 기준

- [ ] **Step 1: 운영 기준 문서를 작성한다**

`docs/privacy/inquiry-data-handling.md`에 아래 내용을 그대로 기록한다.

```markdown
# 외주 문의 개인정보 처리 운영 기준

## 데이터 흐름

1. 이용자가 `/contact`에서 기업명, 담당자 성명, 이메일, 연락처, 선호 연락 방법, 예산과 선택 문의 내용을 입력한다.
2. 브라우저가 같은 도메인의 `POST /api/contact`로 값을 전송한다.
3. Vercel 서버 함수는 유효성 및 두 필수 동의를 검사한 뒤 Slack `chat.postMessage`로 전체 문의 내용을 전달한다.
4. 애플리케이션 데이터베이스에는 문의 레코드를 저장하지 않는다.
5. 서버 오류 로그에는 입력값, Slack 토큰, 채널 ID를 남기지 않고 응답 상태와 Slack 오류 코드만 남긴다.

## 보관 및 파기

- 문의 내용의 보관기간은 접수일로부터 365일이다.
- Slack 문의 채널은 메시지 및 파일을 365일 후 자동 삭제하도록 설정한다.
- 삭제·처리정지 요청은 `contact@zerofee.kr` 또는 `010-3242-8118`로 접수하고 본인 확인 후 대상 Slack 메시지를 검색해 삭제한다.
- 외주 계약이 체결되면 계약 수행을 위해 별도로 생성된 계약서·견적서·프로젝트 자료는 해당 계약과 관계 법령에 따른 별도 기록으로 관리한다.

## 수탁 및 국외 처리

- Vercel Inc.: 사이트 호스팅과 서버 함수 실행. 문의 본문을 앱 로그에 저장하지 않으며 Slack 전달 과정에서 일시 처리한다.
- Slack Technologies, LLC: 문의 알림과 내부 상담 협업. 문의 전체 항목을 365일 보관한다.
- Slack 서울 데이터 레지던시와 Vercel 국내 처리 지역을 증명하는 관리자 자료가 없으면 두 회사의 처리 국가를 미국으로 공개한다.
- 회사소개 페이지에서 Google 지도가 표시되면 Google LLC가 지도 제공 과정에서 IP 주소와 기기·브라우저 정보를 처리할 수 있음을 처리방침에 공개한다.

## 접근 통제

- Slack 문의 채널 접근자는 상담 담당자와 개인정보 보호책임자로 제한한다.
- 퇴사·역할 변경 당일에 채널 접근 권한을 제거한다.
- 분기마다 채널 멤버와 365일 보관 설정을 검토한다.
- 주민등록번호, 계좌·카드정보, 건강정보 등 민감하거나 고유식별 가능한 정보를 문의 내용에 입력하지 않도록 폼에서 안내한다.
```

- [ ] **Step 2: 실제 운영 설정을 읽기 전용으로 확인한다**

확인 항목:

1. Vercel 프로젝트의 함수 실행 지역과 로그 보관 설정
2. Slack 워크스페이스 요금제와 데이터 레지던시
3. Slack 문의 채널의 메시지·파일 보관기간
4. 운영 환경의 `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` 사용 여부

관리자 자료로 국내 처리가 확인되지 않으면 정책 문구는 미국 이전 기준을 유지한다. Slack 보관 설정이 365일이 아니면 문서 공개 전에 365일로 변경한다.

- [ ] **Step 3: 운영 기준 문서의 필수 문구를 검증한다**

Run:

```bash
rg -n "365일|Vercel Inc\.|Slack Technologies|미국|contact@zerofee\.kr|앱 데이터베이스에는" docs/privacy/inquiry-data-handling.md
```

Expected: 여섯 기준이 모두 한 번 이상 출력된다.

- [ ] **Step 4: 운영 기준만 별도 커밋한다**

```bash
git add docs/privacy/inquiry-data-handling.md
git commit -m "docs(privacy): define inquiry data handling"
```

---

### Task 2: 디지털 콘텐츠 약관을 사이트 이용약관으로 교체

**Files:**
- Modify: `apps/web/app/term/content.ts`
- Modify: `apps/web/app/term/page.tsx`
- Modify: `apps/web/app/term/page.test.mjs`

**Interfaces:**
- Consumes: 기존 `TermsChapter`, `TermsArticle`, `TermsBlock` 타입과 문서 렌더러
- Produces: `termsChapters` 12개 조항과 `termsEffectiveDate`

- [ ] **Step 1: 새 약관 계약을 먼저 테스트로 고정한다**

`apps/web/app/term/page.test.mjs`의 첫 테스트를 다음 기준으로 교체한다.

```js
test("the terms route describes the public outsourcing inquiry site", async () => {
  const [page, content, styles] = await Promise.all([
    readOrEmpty("./page.tsx"),
    readOrEmpty("./content.ts"),
    readOrEmpty("./page.module.css"),
  ]);

  assert.match(page, /<Header \/>/);
  assert.match(page, /<Footer \/>/);
  assert.match(page, /<h1[^>]*>사이트 이용약관<\/h1>/);
  assert.match(page, /termsChapters\.map/);

  for (const title of [
    "제1조 (목적)",
    "제2조 (정의)",
    "제3조 (약관과 개별 계약의 관계)",
    "제4조 (사이트가 제공하는 기능)",
    "제5조 (문의 접수)",
    "제6조 (이용자의 의무)",
    "제7조 (사이트 콘텐츠의 권리)",
    "제8조 (이용자가 제출한 내용)",
    "제9조 (외부 서비스와 링크)",
    "제10조 (책임의 범위)",
    "제11조 (약관의 변경)",
    "제12조 (준거법 및 관할)",
  ]) {
    assert.ok(content.includes(title), title);
  }

  assert.equal(content.match(/title: "제\d+조/g)?.length, 12);
  assert.match(content, /문의 제출만으로 외주 개발 계약이 성립하지 않습니다/);
  assert.match(content, /개별 계약의 내용이 우선합니다/);
  assert.match(content, /개인정보처리방침/);
  assert.match(content, /2026년 7월 18일부터 시행됩니다/);

  for (const obsoleteTerm of [
    "크리에이터",
    "구매자",
    "카카오 로그인",
    "빌링키",
    "링크 페이",
    "정기 결제",
    "청약철회",
    "정산",
  ]) {
    assert.ok(!content.includes(obsoleteTerm), obsoleteTerm);
  }

  assert.match(styles, /@media \(max-width: 768px\)/);
});
```

- [ ] **Step 2: 테스트가 옛 약관 때문에 실패하는지 확인한다**

Run:

```bash
cd apps/web && node --test app/term/page.test.mjs
```

Expected: `사이트 이용약관`, 12개 조항 또는 금지 용어 검사에서 FAIL.

- [ ] **Step 3: `termsChapters`를 아래 12개 조항으로 교체한다**

기존 타입 정의와 렌더러는 유지하고, 각 조항에 다음 의미가 빠짐없이 들어가게 한다.

```ts
const termsCopy = {
  purpose:
    "본 약관은 제로피(제로소싱, 이하 ‘회사’)가 운영하는 zerosourcing.kr 웹사이트에서 제공하는 회사·서비스 정보 열람 및 외주 개발 문의 기능의 이용 조건과 회사 및 이용자의 권리·의무를 정함을 목적으로 합니다.",
  definitions: [
    "사이트: 회사가 운영하는 zerosourcing.kr 및 그 하위 페이지를 말합니다.",
    "이용자: 사이트를 방문하거나 문의 기능을 사용하는 자를 말합니다.",
    "문의 서비스: 이용자가 외주 개발 상담을 위해 정보를 제출하고 회사가 이를 검토해 연락하는 기능을 말합니다.",
    "개별 계약: 견적서, 업무범위서, 개발 계약서 등 회사와 고객이 별도로 합의한 문서를 말합니다.",
  ],
  contractPriority: [
    "문의 제출만으로 외주 개발 계약이 성립하지 않습니다.",
    "프로젝트의 범위, 일정, 대금, 검수, 결과물의 권리, 유지보수와 하자 책임은 별도 개별 계약에서 정합니다.",
    "본 약관과 개별 계약이 충돌하는 경우 개별 계약의 내용이 우선합니다.",
  ],
  siteFunctions: [
    "회사·서비스·포트폴리오·블로그·FAQ 정보 제공",
    "외주 개발 문의 접수 및 상담 연락",
    "회사가 제공하거나 연결하는 기타 정보 기능",
  ],
  inquiry: [
    "이용자는 정확하고 연락 가능한 정보를 입력해야 합니다.",
    "회사가 제공하는 상담 내용과 예상 견적은 개별 계약 체결 전까지 확정된 계약 조건이 아닙니다.",
    "회사는 문의 내용, 수행 가능성 또는 운영 사정에 따라 상담이나 견적 제공을 제한할 수 있습니다.",
  ],
  prohibited: [
    "타인의 정보를 도용하거나 허위 정보를 입력하는 행위",
    "사이트 또는 제3자의 권리를 침해하거나 불법 정보를 전송하는 행위",
    "악성 코드, 과도한 자동 요청 등 사이트 운영을 방해하는 행위",
  ],
  siteRights:
    "사이트의 문구, 디자인, 상표, 포트폴리오와 기타 콘텐츠의 권리는 회사 또는 정당한 권리자에게 있으며, 사전 허락 없이 영리 목적으로 복제·배포·수집할 수 없습니다.",
  submittedContent:
    "회사는 이용자가 문의에 제출한 내용을 상담 검토와 연락에 필요한 범위에서만 사용합니다. 문의 제출로 이용자의 아이디어나 자료의 소유권이 회사에 이전되지는 않습니다.",
  externalServices:
    "사이트에는 외부 웹사이트나 지도 서비스가 연결될 수 있으며, 외부 서비스의 이용에는 해당 사업자의 약관과 개인정보 처리 기준이 적용됩니다.",
  liability: [
    "회사는 고의 또는 중대한 과실이 없는 한 천재지변, 통신 장애, 이용자의 귀책사유로 발생한 손해에 책임을 지지 않습니다.",
    "외주 개발 프로젝트에 관한 책임은 해당 개별 계약에 따릅니다.",
    "본 조는 관계 법령상 배제할 수 없는 회사의 책임을 제한하지 않습니다.",
    "문의 과정의 개인정보 처리는 개인정보처리방침에 따릅니다.",
  ],
  changes:
    "회사는 관계 법령과 서비스 변경을 반영해 약관을 개정할 수 있으며, 시행일과 변경 내용을 사이트에 게시합니다. 이용자에게 불리한 중대한 변경은 시행 30일 전에 알립니다.",
  law:
    "본 약관은 대한민국 법률에 따르며, 분쟁의 관할은 민사소송법 등 관계 법령에 따릅니다.",
} as const;
```

배치 순서는 `제1장 총칙`(제1조~제3조), `제2장 사이트 이용`(제4조~제9조), `제3장 책임 및 기타`(제10조~제12조)로 한다. `termsEffectiveDate`는 다음 값으로 교체한다.

```ts
export const termsEffectiveDate =
  "본 약관은 2026년 7월 18일부터 시행됩니다.";
```

- [ ] **Step 4: 페이지 제목과 메타데이터를 사이트 역할에 맞춘다**

`apps/web/app/term/page.tsx`의 메타데이터와 제목을 다음 값으로 바꾼다.

```ts
export const metadata = createPageMetadata({
  title: "제로소싱 | 사이트 이용약관",
  description:
    "제로소싱 웹사이트와 외주 개발 문의 서비스의 이용 기준 및 개별 개발 계약과의 관계를 안내합니다.",
  path: "/term",
});
```

```tsx
<h1 className={styles.title}>사이트 이용약관</h1>
```

- [ ] **Step 5: 이용약관 테스트를 통과시킨다**

Run:

```bash
cd apps/web && node --test app/term/page.test.mjs
```

Expected: 2 tests PASS.

- [ ] **Step 6: 이용약관 변경만 커밋한다**

```bash
git add apps/web/app/term/content.ts apps/web/app/term/page.tsx apps/web/app/term/page.test.mjs
git commit -m "docs(legal): align terms with inquiry site"
```

---

### Task 3: 개인정보처리방침을 실제 문의 데이터 흐름으로 교체

**Files:**
- Modify: `apps/web/app/privacy/content.ts`
- Modify: `apps/web/app/privacy/page.tsx`
- Modify: `apps/web/app/privacy/page.test.mjs`

**Interfaces:**
- Consumes: 기존 `PrivacyArticle`, `PrivacyBlock`, `PrivacyListItem` 타입과 Task 1의 운영 기준
- Produces: `privacyIntroduction`, 13개 `privacyArticles`

- [ ] **Step 1: 실제 수집·처리 계약을 먼저 테스트로 고정한다**

`apps/web/app/privacy/page.test.mjs`의 첫 테스트를 다음 기준으로 교체한다.

```js
test("the privacy route describes the actual inquiry data flow", async () => {
  const [page, content, styles, sharedStyles] = await Promise.all([
    readOrEmpty("./page.tsx"),
    readOrEmpty("./content.ts"),
    readOrEmpty("./page.module.css"),
    readOrEmpty("../term/page.module.css"),
  ]);

  assert.match(page, /<Header \/>/);
  assert.match(page, /<Footer \/>/);
  assert.match(page, /<h1[^>]*>개인정보처리방침<\/h1>/);
  assert.match(page, /privacyArticles\.map/);

  for (const requiredCopy of [
    "기업명",
    "담당자 성명",
    "이메일",
    "연락처",
    "선호 연락 방법",
    "예산",
    "문의 내용",
    "접수일로부터 1년",
    "제3자에게 제공하지 않습니다",
    "Vercel Inc.",
    "Slack Technologies, LLC",
    "미국",
    "contact@zerofee.kr",
    "010-3242-8118",
  ]) {
    assert.ok(content.includes(requiredCopy), requiredCopy);
  }

  assert.equal(content.match(/title:\s*"제\d+조/g)?.length, 13);
  assert.match(content, /문의 내용은 선택 항목/);
  assert.match(content, /애플리케이션 데이터베이스에 저장하지 않습니다/);
  assert.match(content, /시행일: 2026년 7월 18일/);

  for (const obsoleteTerm of [
    "카카오 간편 로그인",
    "닉네임",
    "빌링키",
    "정산 계좌",
    "토스페이먼츠",
    "링크허브",
    "마이페이지",
    "탈퇴하기",
    "맞춤형 서비스",
    "Bubble",
    "AWS",
  ]) {
    assert.ok(!content.includes(obsoleteTerm), obsoleteTerm);
  }

  assert.match(content, /https:\/\/privacy\.kisa\.or\.kr\//);
  assert.match(styles, /focus-visible/);
  assert.match(sharedStyles, /@media \(max-width: 768px\)/);
});
```

- [ ] **Step 2: 테스트가 옛 처리방침 때문에 실패하는지 확인한다**

Run:

```bash
cd apps/web && node --test app/privacy/page.test.mjs
```

Expected: 실제 폼 필드, 수탁자, 13개 조항 또는 금지 용어 검사에서 FAIL.

- [ ] **Step 3: 방침 본문을 아래 13개 조항으로 교체한다**

`privacyIntroduction`은 다음과 같이 교체한다.

```ts
export const privacyIntroduction =
  "제로피(제로소싱, 이하 ‘회사’)는 「개인정보 보호법」 등 관계 법령에 따라 개인정보를 보호하고, 외주 개발 문의 과정에서 처리하는 개인정보와 이용자의 권리를 다음과 같이 안내합니다.";
```

`privacyArticles`에는 다음 제목과 내용을 정확히 반영한다.

1. `제1조 (개인정보의 처리 목적)`
   - 외주 개발 상담 접수와 본인·연락처 확인
   - 요구사항·예산 검토와 상담·견적 준비
   - 문의 답변, 민원 처리, 악성·반복 문의 방지
2. `제2조 (처리하는 개인정보의 항목 및 수집 방법)`
   - 필수: 기업명, 담당자 성명, 이메일, 연락처, 선호 연락 방법, 예산
   - 선택: 문의 내용
   - `문의 내용은 선택 항목입니다.`를 독립 문장으로 표시
   - 수집 방법: `/contact`에서 이용자가 직접 입력
3. `제3조 (처리의 법적 근거)`
   - 개인정보 수집·이용 동의
   - 국외 이전 동의
   - 법령상 의무 또는 분쟁 대응이 필요한 경우 해당 법령
4. `제4조 (처리 및 보유기간)`
   - 문의 접수일로부터 1년 후 파기
   - 삭제 요청을 받아 보관 필요가 없으면 1년 전에도 파기
   - 계약 체결 후 별도로 생성된 계약·프로젝트 기록은 개별 계약과 관계 법령에 따라 별도 관리
5. `제5조 (개인정보의 제3자 제공)`
   - 원칙적으로 제3자에게 제공하지 않음
   - 정보주체의 별도 동의 또는 법령상 근거가 있는 경우만 예외
   - 수탁자는 제3자 제공이 아니라 제6조에서 공개
6. `제6조 (개인정보 처리업무의 위탁)`
   - Vercel Inc.: 웹사이트 호스팅, 보안, 서버 함수 실행
   - Slack Technologies, LLC: 외주 문의 전달, 상담 알림, 내부 협업
   - 수탁자 변경 시 본 방침에서 공개
7. `제7조 (개인정보의 국외 이전)`
   - Vercel Inc. / 미국 / 문의 제출 시 네트워크 전송 / 폼 입력값 및 IP 등 기술정보 / 호스팅·서버 함수 처리 / Slack 전달 완료 시까지 일시 처리하며 앱 로그에 문의 본문을 기록하지 않음
   - Slack Technologies, LLC / 미국 / 문의 제출 시 네트워크 전송 / 필수·선택 폼 전체 항목 / 문의 알림·내부 상담 협업 / 접수일로부터 1년
   - 이전을 거부할 수 있으나 필수 국외 이전에 동의하지 않으면 문의 폼 제출이 불가함
8. `제8조 (개인정보의 파기 절차 및 방법)`
   - 보유기간 종료 또는 목적 달성 시 지체 없이 파기
   - Slack 메시지와 첨부파일은 365일 자동 삭제 및 요청 시 수동 삭제
   - 전자 파일은 복구하기 어려운 방법으로 삭제
9. `제9조 (정보주체의 권리와 행사 방법)`
   - 열람·정정·삭제·처리정지·동의 철회 요청 가능
   - `contact@zerofee.kr`, `010-3242-8118`로 접수
   - 본인 또는 정당한 대리인 확인 후 법정 기한 안에 처리
10. `제10조 (자동 수집 정보 및 외부 서비스)`
    - 현재 맞춤형 광고나 행동정보 분석을 위한 쿠키를 운영하지 않음
    - 호스팅·보안 과정에서 IP 주소와 접속 정보가 생성될 수 있음
    - 회사소개 페이지에서 Google 지도가 표시되는 경우 Google LLC가 IP 주소와 기기·브라우저 정보를 처리할 수 있으며 Google 개인정보처리방침이 적용됨
11. `제11조 (개인정보의 안전성 확보조치)`
    - HTTPS 전송 암호화
    - Slack 문의 채널 최소 권한과 분기별 멤버 점검
    - 비밀키의 서버 환경변수 관리
    - 서버 로그에 문의 본문·토큰·채널 ID를 기록하지 않음
    - 문의 폼에서 민감정보·고유식별정보 입력 금지 안내
12. `제12조 (개인정보 보호책임자 및 고충 처리)`
    - 개인정보 보호책임자: 이동규
    - 이메일: `contact@zerofee.kr`
    - 전화: `010-3242-8118`
13. `제13조 (권익침해 구제 및 방침 변경)`
    - 개인정보침해신고센터 `https://privacy.kisa.or.kr/`
    - 개인정보분쟁조정위원회 `https://www.kopico.go.kr/`
    - 대검찰청 `https://www.spo.go.kr/`
    - 경찰청 `https://ecrm.police.go.kr/`
    - 개정 시 시행일과 변경 내용을 이 페이지에 공개하고 중대한 불리한 변경은 30일 전 공개
    - `시행일: 2026년 7월 18일`

리스트와 링크는 기존 `PrivacyBlock`과 `PrivacyListItem` 구조로 표현한다. 제7조에서는 수탁자별 이전 국가·시점 및 방법·항목·목적·보유기간을 각각 하나의 상위 목록 항목과 하위 항목으로 분리한다.

- [ ] **Step 4: 메타데이터를 문의 처리방침에 맞춘다**

`apps/web/app/privacy/page.tsx`의 메타데이터를 다음 값으로 교체한다.

```ts
export const metadata = createPageMetadata({
  title: "제로소싱 | 개인정보처리방침",
  description:
    "제로소싱 외주 문의 과정에서 수집하는 개인정보의 항목, 이용 목적, 보유기간 및 처리 위탁·국외 이전 사항을 안내합니다.",
  path: "/privacy",
});
```

- [ ] **Step 5: 개인정보처리방침 테스트를 통과시킨다**

Run:

```bash
cd apps/web && node --test app/privacy/page.test.mjs
```

Expected: 2 tests PASS.

- [ ] **Step 6: 처리방침 변경만 커밋한다**

```bash
git add apps/web/app/privacy/content.ts apps/web/app/privacy/page.tsx apps/web/app/privacy/page.test.mjs
git commit -m "docs(privacy): align policy with inquiry flow"
```

---

### Task 4: 문의 폼에서 동의 내용을 제출 전에 확인하게 만들기

**Files:**
- Create: `apps/web/app/contact/contact-privacy-consent.test.mjs`
- Modify: `apps/web/app/contact/page.tsx`
- Modify: `apps/web/app/contact/page.module.css`
- Modify: `apps/web/app/api/contact/route.ts`

**Interfaces:**
- Consumes: Task 3의 수집 항목, 1년 보관, Slack·Vercel 미국 이전 기준
- Produces: 요청 JSON의 `privacyConsent: boolean`, `overseasTransferConsent: boolean`

- [ ] **Step 1: 동의 UI와 서버 검증 계약을 먼저 테스트로 만든다**

`apps/web/app/contact/contact-privacy-consent.test.mjs`를 생성한다.

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./page.tsx", import.meta.url);
const stylesPath = new URL("./page.module.css", import.meta.url);
const apiPath = new URL("../api/contact/route.ts", import.meta.url);

test("the contact form discloses collection and overseas transfer before submit", async () => {
  const [page, styles, api] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(stylesPath, "utf8"),
    readFile(apiPath, "utf8"),
  ]);

  assert.match(page, /name="privacyConsent"/);
  assert.match(page, /name="overseasTransferConsent"/);
  assert.equal(page.match(/name="(?:privacyConsent|overseasTransferConsent)"/g)?.length, 2);
  assert.match(page, /개인정보 수집·이용 동의/);
  assert.match(page, /개인정보 국외 이전 동의/);
  assert.match(page, /외주 개발 상담 접수, 연락 및 견적 검토/);
  assert.match(page, /접수일로부터 1년/);
  assert.match(page, /Vercel Inc\./);
  assert.match(page, /Slack Technologies, LLC/);
  assert.match(page, /미국/);
  assert.match(page, /문의 내용은 선택 항목/);
  assert.match(page, /주민등록번호, 계좌·카드정보, 건강정보/);
  assert.match(page, /<details/);
  assert.match(page, /<summary/);
  assert.doesNotMatch(page, /<button[^>]*className=\{styles\.privacyLink\}/);

  assert.match(api, /data\.privacyConsent !== true/);
  assert.match(api, /data\.overseasTransferConsent !== true/);
  assert.match(styles, /\.consentDetails/);
  assert.match(styles, /focus-visible/);
});
```

- [ ] **Step 2: 새 동의 계약이 현재 코드에서 실패하는지 확인한다**

Run:

```bash
cd apps/web && node --test app/contact/contact-privacy-consent.test.mjs
```

Expected: `overseasTransferConsent`, `details`, 고지 문구 검사에서 FAIL.

- [ ] **Step 3: 두 동의 값을 요청 본문에 포함한다**

`apps/web/app/contact/page.tsx`에서 요청 본문을 만드는 객체에 다음 값을 둔다.

```ts
privacyConsent: formData.get("privacyConsent") === "true",
overseasTransferConsent:
  formData.get("overseasTransferConsent") === "true",
```

- [ ] **Step 4: 죽어 있는 `보기` 버튼을 네이티브 펼침 고지 두 개로 교체한다**

현재 `privacyRow`를 다음 구조로 교체한다.

```tsx
<div className={styles.consentList}>
  <div className={styles.consentItem}>
    <Checkbox
      label="개인정보 수집·이용 동의"
      name="privacyConsent"
      required
      style={privacyCheckboxStyle}
      value="true"
    />
    <details className={styles.consentDetails}>
      <summary className={styles.consentSummary}>보기</summary>
      <div className={styles.consentPanel}>
        <p>목적: 외주 개발 상담 접수, 연락 및 견적 검토</p>
        <p>필수 항목: 기업명, 담당자 성명, 이메일, 연락처, 선호 연락 방법, 예산</p>
        <p>선택 항목: 문의 내용은 선택 항목입니다.</p>
        <p>보유기간: 문의 접수일로부터 1년</p>
        <p>동의를 거부할 수 있으나 필수 항목 동의 없이는 문의를 제출할 수 없습니다.</p>
      </div>
    </details>
  </div>

  <div className={styles.consentItem}>
    <Checkbox
      label="개인정보 국외 이전 동의"
      name="overseasTransferConsent"
      required
      style={privacyCheckboxStyle}
      value="true"
    />
    <details className={styles.consentDetails}>
      <summary className={styles.consentSummary}>보기</summary>
      <div className={styles.consentPanel}>
        <p>이전받는 자: Vercel Inc., Slack Technologies, LLC</p>
        <p>이전 국가: 미국</p>
        <p>이전 시점·방법: 문의 제출 시 암호화된 네트워크로 전송</p>
        <p>이전 항목: 필수 항목과 이용자가 입력한 선택 문의 내용</p>
        <p>목적: 사이트 호스팅·서버 처리, 문의 알림 및 내부 상담 협업</p>
        <p>보유기간: Vercel은 Slack 전달 완료 시까지 일시 처리, Slack은 접수일로부터 1년</p>
        <p>동의를 거부할 수 있으나 국외 이전 동의 없이는 문의를 제출할 수 없습니다.</p>
      </div>
    </details>
  </div>

  <p className={styles.sensitiveDataNotice}>
    주민등록번호, 계좌·카드정보, 건강정보 등 민감한 개인정보는 문의 내용에 입력하지 마세요.
  </p>
</div>
```

별도 모달 상태, 포털, UI 라이브러리는 추가하지 않는다. 사용자는 키보드로 `summary`를 열고 닫을 수 있으며 JavaScript가 실패해도 고지 내용을 확인할 수 있다.

- [ ] **Step 5: 디자인 시스템 규칙으로 고지 패널을 스타일링한다**

`apps/web/app/contact/page.module.css`에서 기존 `.privacyRow`, `.privacyLink`를 제거하고 다음 역할의 클래스를 추가한다.

```css
.consentList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.consentItem {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.consentDetails {
  width: 100%;
  color: var(--color-gray-500);
}

.consentSummary {
  composes: pretendard-medium-14 from global;
  cursor: pointer;
}

.consentSummary:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 3px;
}

.consentPanel {
  composes: pretendard-medium-12-16 from global;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: var(--color-gray-50);
  color: var(--color-gray-600);
}

.sensitiveDataNotice {
  composes: pretendard-medium-12-16 from global;
  color: var(--color-gray-500);
}
```

위 코드는 `design-system.css`에 정의된 `--color-brand-500`, `--color-gray-50`, `--color-gray-200`, `--color-gray-500`, `--color-gray-600`만 사용한다. 모바일에서도 같은 한 열 구조와 `gap: 8px`을 유지하므로 별도 그리드 재배치는 추가하지 않는다.

- [ ] **Step 6: 서버에서 두 동의를 모두 필수 검증한다**

`apps/web/app/api/contact/route.ts`의 `parseContactMessage` 거절 조건에 다음 검사를 함께 둔다.

```ts
data.privacyConsent !== true ||
data.overseasTransferConsent !== true
```

동의값은 Slack 메시지 본문에 넣지 않는다. 기존 오류 로그는 문의 입력값을 기록하지 않으므로 유지한다.

- [ ] **Step 7: 동의 UI 테스트를 통과시킨다**

Run:

```bash
cd apps/web && node --test app/contact/contact-privacy-consent.test.mjs app/contact/contact-phone-format.test.mjs
```

Expected: 2 tests PASS.

- [ ] **Step 8: 문의 동의 변경만 커밋한다**

```bash
git add apps/web/app/contact/contact-privacy-consent.test.mjs apps/web/app/contact/page.tsx apps/web/app/contact/page.module.css apps/web/app/api/contact/route.ts
git commit -m "feat(contact): disclose privacy consent details"
```

---

### Task 5: 메타데이터와 전체 회귀검증

**Files:**
- Modify: `apps/web/app/site-metadata.test.mjs`
- Verify: `apps/web/components/Footer.tsx`
- Verify: `apps/web/app/sitemap.ts`
- Verify: `apps/web/app/term/page.tsx`
- Verify: `apps/web/app/privacy/page.tsx`
- Verify: `apps/web/app/contact/page.tsx`

**Interfaces:**
- Consumes: Tasks 2~4의 공개 문구와 경로
- Produces: 검색 결과 문구와 배포 전 품질 증거

- [ ] **Step 1: 메타데이터 기대값을 새 문구로 바꾼다**

`apps/web/app/site-metadata.test.mjs`의 두 항목을 다음 값으로 교체한다.

```js
{
  file: "./term/page.tsx",
  path: "/term",
  title: "제로소싱 | 사이트 이용약관",
  description:
    "제로소싱 웹사이트와 외주 개발 문의 서비스의 이용 기준 및 개별 개발 계약과의 관계를 안내합니다.",
},
{
  file: "./privacy/page.tsx",
  path: "/privacy",
  title: "제로소싱 | 개인정보처리방침",
  description:
    "제로소싱 외주 문의 과정에서 수집하는 개인정보의 항목, 이용 목적, 보유기간 및 처리 위탁·국외 이전 사항을 안내합니다.",
},
```

- [ ] **Step 2: 법률 페이지와 메타데이터의 집중 테스트를 실행한다**

Run:

```bash
cd apps/web && node --test app/term/page.test.mjs app/privacy/page.test.mjs app/contact/contact-privacy-consent.test.mjs app/contact/contact-phone-format.test.mjs app/site-metadata.test.mjs
```

Expected: 모든 테스트 PASS.

- [ ] **Step 3: 웹 앱 전체 정적 검증을 실행한다**

Run:

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
pnpm --filter web build
```

Expected: 각 명령 exit code 0, ESLint warning 0, TypeScript error 0, test failure 0, Next.js build 성공.

- [ ] **Step 4: 데스크톱과 모바일에서 수동 검증한다**

검증 화면:

1. `/term`: 12개 조항, 사이트 이용약관 제목, 시행일, Footer 링크
2. `/privacy`: 13개 조항, 필수·선택 항목, Slack·Vercel, 미국 이전, 1년 보관, 연락처, 외부 기관 링크
3. `/contact`: 두 동의의 `보기`가 마우스와 키보드로 열리고, 320px 폭에서 잘리지 않으며, 동의하지 않으면 제출되지 않음
4. 문의 1건 제출: Slack에는 문의 내용만 도착하고 동의값·토큰·채널 ID는 표시되지 않음
5. 서버 로그: 문의 원문, 이메일, 전화번호, Slack 토큰이 출력되지 않음
6. Footer와 sitemap: `/term`, `/privacy` 경로가 그대로 유지됨

- [ ] **Step 5: 공개 전 운영·법률 승인 조건을 확인한다**

배포 승인 조건:

- Slack 문의 채널의 365일 자동 삭제 설정 화면을 저장했다.
- Slack·Vercel 처리 국가 판단에 사용한 관리자 자료를 저장했다.
- 개인정보 보호책임자가 Slack 채널 접근자 목록을 승인했다.
- 국내 개인정보보호 법률 전문가가 수집·이용, 국외 이전 동의와 13개 조항을 검토했다.
- 검토 과정에서 문구가 바뀌면 같은 커밋에서 해당 `content.ts`, 문의 고지, 테스트 기대값을 함께 바꿨다.

- [ ] **Step 6: 메타데이터·최종 검증 변경을 커밋한다**

```bash
git add apps/web/app/site-metadata.test.mjs
git commit -m "test(legal): verify policy metadata"
```

---

## 완료 기준

- `/term`에 회원·크리에이터·결제·구독·정산·환불 문구가 남아 있지 않다.
- `/privacy`의 수집 항목이 문의 폼 필드와 정확히 일치하고 선택 문의 내용이 구분돼 있다.
- Slack과 Vercel의 처리위탁 및 미국 국외 이전이 공개돼 있다.
- 문의 보관기간 문구와 Slack 실제 보관 설정이 모두 365일이다.
- 문의 제출 전 수집·이용 및 국외 이전의 목적·항목·기간·거부권을 각각 확인할 수 있다.
- 이용약관이 사이트 이용 기준만 다루고 프로젝트별 범위·대금·권리·하자보수는 개별 계약이 우선한다고 명시한다.
- 집중 테스트, lint, 타입 검사, 전체 테스트, 프로덕션 빌드와 모바일·데스크톱 수동 검증이 모두 통과한다.

## 공식 참고자료

- 개인정보보호위원회, [2026 개인정보 처리방침 작성지침](https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030000.Updated&nttId=12018)
- 국가법령정보센터, [개인정보 보호법 제15조](https://law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0015&lsiSeq=270351&urlMode=lsScJoRltInfoR)
- 국가법령정보센터, [개인정보 보호법 제30조](https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0030&lsiSeq=270351&urlMode=lsScJoRltInfoR)
- Slack, [Data residency for Slack](https://slack.com/help/articles/360035633934-Data-residency-for-Slack-Data-residency-for-Slack)
- Slack, [Customize data retention in Slack](https://slack.com/help/articles/203457187-Customize-data-retention-in-Slack)
- Vercel, [Vercel Functions](https://vercel.com/docs/functions)
- Vercel, [Data Processing Addendum](https://vercel.com/legal/dpa)
