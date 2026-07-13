# 메인 02 서비스 아이콘 Header Liquid Glass 적용 구현 계획

> **에이전트 작업자 필수 사항:** 이 계획을 실행할 때 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용해 태스크 단위로 구현한다. 진행 상황은 각 단계의 체크박스(`- [ ]`)로 관리한다.

**목표:** 메인 페이지의 `02 이런 걸 만듭니다` 섹션에 있는 3개 서비스 카드 아이콘 래퍼에 현재 헤더와 동일한 light liquid glass 표면·굴절 스타일을 적용하고, About 페이지의 재사용 섹션은 기존 모양을 유지한다.

**아키텍처:** 헤더 CSS에만 들어 있는 liquid glass 외형을 `apps/web/app/glass.css`의 재사용 가능한 `zsHeaderLiquid` appearance로 승격한다. `GlassSurface`가 이 appearance를 선택할 수 있게 한 뒤, `ServiceCard`에 표시 전용 variant를 추가하고 메인 페이지의 `BusinessTypesSection`에서만 opt-in한다. 아이콘은 기존 `Icon` registry와 `currentColor` 동작을 그대로 사용한다.

**기술 스택:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS Modules, shared `GlassSurface`, Node.js test runner.

## 전역 제약 사항

- UI 변경 전 확인한 `design.md`의 타이포그래피, 컬러, 아이콘, `gap`, 크기 제약 규칙을 따른다.
- 제품 UI 아이콘은 `apps/web/components/Icon.tsx`의 `Icon`만 사용하며 새 SVG·PNG·로컬 아이콘 래퍼 컴포넌트를 만들지 않는다.
- 아이콘 프레임은 현재의 `40px × 40px`, glyph는 `20px`, radius는 `16px`를 유지한다.
- 헤더의 `blur(8px)`, `saturate(1.5)`, 배경, inset highlight, shadow 외형을 기준으로 삼는다.
- 80px 헤더의 `bezel: 18`, `scale: 54` 비율을 40px 아이콘 프레임에 맞춰 `bezel: 9`, `scale: 27`로 축소한다.
- 메인 `/`만 liquid variant를 사용하고 `/about`의 `BusinessTypesSection`은 기본 `plain` variant를 유지한다.
- 서비스 카드 링크, CTA 이벤트, hover/focus 색상 전환, 반응형 grid 동작은 변경하지 않는다.
- `min-width`, `min-height`, child margin을 새로 추가하지 않는다.
- 현재 작업트리에 관련 파일의 미커밋 변경이 있으므로 이를 보존한다. 아래 커밋 단계는 변경이 분리된 작업트리에서만 실행하고, 현재 작업트리에서 실행할 경우 커밋은 생략한다.

---

### Task 1: 헤더 Liquid Glass 외형을 공용 appearance로 승격

**파일:**
- Create: `apps/web/components/ServiceCard.liquid-glass.test.mjs`
- Modify: `apps/web/components/GlassSurface.tsx`
- Modify: `apps/web/app/glass.css`
- Modify: `apps/web/components/Header.tsx`
- Modify: `apps/web/components/Header.module.css`
- Test: `apps/web/components/ServiceCard.liquid-glass.test.mjs`

**인터페이스:**
- Consumes: `ensureGlassFilter(options): string`, `supportsGlassRefraction(): boolean` from `apps/web/components/glassFilter.ts`.
- Produces: `GlassSurfaceAppearance = "default" | "header"`와 `GlassSurfaceProps.appearance?: GlassSurfaceAppearance`.
- Produces: 헤더와 작은 표면에서 함께 사용할 전역 클래스 `zsHeaderLiquid`.

- [ ] **Step 1: 공용 header appearance 계약을 검증하는 실패 테스트 작성**

`apps/web/components/ServiceCard.liquid-glass.test.mjs`를 다음 내용으로 만든다.

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const aboutPagePath = new URL("../app/about/page.tsx", import.meta.url);
const businessTypesPath = new URL("./BusinessTypesSection.tsx", import.meta.url);
const glassStylesPath = new URL("../app/glass.css", import.meta.url);
const glassSurfacePath = new URL("./GlassSurface.tsx", import.meta.url);
const headerPath = new URL("./Header.tsx", import.meta.url);
const headerStylesPath = new URL("./Header.module.css", import.meta.url);
const homePagePath = new URL("../app/page.tsx", import.meta.url);
const serviceCardPath = new URL("./ServiceCard.tsx", import.meta.url);
const serviceCardStylesPath = new URL(
  "./ServiceCard.module.css",
  import.meta.url,
);

test("header liquid visuals are exposed as one shared GlassSurface appearance", async () => {
  const [glassSurface, glassStyles, header, headerStyles] = await Promise.all([
    readFile(glassSurfacePath, "utf8"),
    readFile(glassStylesPath, "utf8"),
    readFile(headerPath, "utf8"),
    readFile(headerStylesPath, "utf8"),
  ]);

  assert.match(
    glassSurface,
    /export type GlassSurfaceAppearance = "default" \| "header";/,
  );
  assert.match(glassSurface, /appearance\?: GlassSurfaceAppearance;/);
  assert.match(glassSurface, /appearance = "default"/);
  assert.match(
    glassSurface,
    /appearance === "header" \? "zsHeaderLiquid" : "zsGlass"/,
  );
  assert.match(
    glassSurface,
    /appearance === "header"[\s\S]*?`blur\(\$\{blurValue\}px\) url\("#\$\{id\}"\) saturate\(\$\{saturate\}\)`/,
  );

  const sharedBlock = glassStyles.match(/\.zsHeaderLiquid\s*\{([^}]*)\}/)?.[1];
  assert.ok(sharedBlock, "zsHeaderLiquid style block is required");
  assert.match(sharedBlock, /background-color:\s*color-mix\(/);
  assert.match(sharedBlock, /blur\(var\(--zs-glass-blur\)\)/);
  assert.match(sharedBlock, /saturate\(var\(--zs-glass-saturate\)\)/);
  assert.match(sharedBlock, /box-shadow:/);
  assert.match(sharedBlock, /border-radius:\s*var\(--zs-glass-radius\);/);

  assert.match(header, /className=\{`\$\{styles\.header\} zsHeaderLiquid`\}/);
  assert.match(headerStyles, /--zs-glass-radius:\s*40px;/);
  assert.match(
    headerStyles,
    /@media \(max-width:\s*1023px\)[\s\S]*?--zs-glass-radius:\s*32px;/,
  );
  assert.doesNotMatch(headerStyles, /background-color:\s*color-mix\(/);
  assert.doesNotMatch(headerStyles, /box-shadow:/);
});
```

- [ ] **Step 2: 테스트가 RED인지 확인**

Run:

```bash
node --test apps/web/components/ServiceCard.liquid-glass.test.mjs
```

Expected: FAIL. `GlassSurfaceAppearance`, `appearance` prop, `zsHeaderLiquid` 클래스가 아직 없고 헤더 외형이 `Header.module.css`에 남아 있다는 메시지가 나온다.

- [ ] **Step 3: `GlassSurface`에 header appearance 추가**

`apps/web/components/GlassSurface.tsx`에 타입과 prop을 추가한다.

```tsx
export type GlassSurfaceAppearance = "default" | "header";

export interface GlassSurfaceProps {
  /** Visual recipe. "header" reuses the site's light header liquid surface. */
  appearance?: GlassSurfaceAppearance;
  refract?: boolean;
  radius?: number;
  bezel?: number;
  scale?: number;
  blur?: number;
  saturate?: number;
  tone?: "light" | "dark";
  interactive?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [key: string]: unknown;
}
```

함수 인자에서 기본값을 정한다.

```tsx
export function GlassSurface({
  appearance = "default",
  refract = false,
  radius,
  bezel,
  scale,
  blur,
  saturate = 1.4,
  tone = "light",
  interactive = false,
  as = "div",
  className = "",
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
```

굴절 필터는 header appearance일 때 현재 헤더와 같은 순서를 사용하고 effect dependency에도 `appearance`를 포함한다.

```tsx
      const blurValue = blur ?? REFRACT_BLUR;
      const value =
        appearance === "header"
          ? `blur(${blurValue}px) url("#${id}") saturate(${saturate})`
          : `url("#${id}") blur(${blurValue}px) saturate(${saturate})`;
      el.style.backdropFilter = value;
      (
        el.style as CSSStyleDeclaration & {
          webkitBackdropFilter?: string;
        }
      ).webkitBackdropFilter = value;
```

```tsx
  }, [appearance, refract, radius, bezel, scale, blur, saturate]);
```

class 조합은 header appearance가 기존 `.zsGlass`의 radial rim/dispersion을 중복 적용하지 않도록 base class 하나만 선택한다.

```tsx
  const classes = [
    appearance === "header" ? "zsHeaderLiquid" : "zsGlass",
    appearance === "default" && tone === "dark" ? "zsGlassDark" : "",
    interactive ? "zsGlassInteractive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
```

- [ ] **Step 4: 헤더 외형을 `glass.css`로 이동**

`apps/web/app/glass.css`의 `.zsGlass` 앞에 아래 공용 appearance를 추가한다.

```css
.zsHeaderLiquid {
  --c-dark: #000;
  --c-glass: #bbbbbc;
  --c-light: #fff;
  --zs-glass-blur: 8px;
  --zs-glass-saturate: 1.5;
  --zs-glass-radius: 40px;
  --zs-glass-fallback: rgb(255 255 255 / 88%);

  position: relative;
  isolation: isolate;
  border: 0;
  border-radius: var(--zs-glass-radius);
  background-color: color-mix(in srgb, var(--c-glass) 12%, transparent);
  -webkit-backdrop-filter: blur(var(--zs-glass-blur))
    saturate(var(--zs-glass-saturate));
  backdrop-filter: blur(var(--zs-glass-blur))
    saturate(var(--zs-glass-saturate));
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--c-light) 10%, transparent),
    inset 1.8px 3px 0 -2px color-mix(in srgb, var(--c-light) 90%, transparent),
    inset -2px -2px 0 -2px color-mix(in srgb, var(--c-light) 80%, transparent),
    inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) 60%, transparent),
    inset -0.3px -1px 4px 0 color-mix(in srgb, var(--c-dark) 12%, transparent),
    inset -1.5px 2.5px 0 -2px color-mix(in srgb, var(--c-dark) 20%, transparent),
    inset 0 3px 4px -2px color-mix(in srgb, var(--c-dark) 20%, transparent),
    inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) 10%, transparent),
    0 1px 5px 0 color-mix(in srgb, var(--c-dark) 10%, transparent),
    0 6px 16px 0 color-mix(in srgb, var(--c-dark) 8%, transparent);
  transition:
    background-color 400ms cubic-bezier(1, 0, 0.4, 1),
    box-shadow 400ms cubic-bezier(1, 0, 0.4, 1);
}
```

기존 fallback selector에는 새 appearance도 포함한다.

```css
@supports not (
  (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
) {
  .zsGlass,
  .zsHeaderLiquid {
    background-color: var(--zs-glass-fallback);
  }
}
```

- [ ] **Step 5: 헤더가 공용 appearance를 사용하도록 연결**

`apps/web/components/Header.tsx`의 native header class만 다음처럼 변경한다. 기존 `ref`, `useLayoutEffect`, 링크, 버튼, 모바일 메뉴는 그대로 둔다.

```tsx
      <header
        className={`${styles.header} zsHeaderLiquid`}
        data-node-id="269:32520"
        ref={headerRef}
      >
```

`apps/web/components/Header.module.css`의 `.header`에서는 liquid 외형 선언을 제거하고 구조와 반응형 radius 변수만 남긴다.

```css
.header {
  --zs-glass-radius: 40px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1360px, 100%);
  height: 80px;
  margin: 0 auto;
  padding: 0 20px 0 40px;
}
```

```css
@media (max-width: 1023px) {
  .header {
    --zs-glass-radius: 32px;

    height: 64px;
    padding: 0 20px;
  }
}
```

- [ ] **Step 6: 공용 appearance 테스트가 GREEN인지 확인**

Run:

```bash
node --test apps/web/components/ServiceCard.liquid-glass.test.mjs apps/web/components/VideoBanner.liquid-glass.test.mjs apps/web/app/liquid-glass/page.test.mjs
```

Expected: 3개 파일의 모든 테스트 PASS. 기존 `GlassSurface` 기본 appearance와 `/liquid-glass` reference route도 유지된다.

- [ ] **Step 7: 분리된 작업트리에서 공용 appearance 커밋**

```bash
git add apps/web/components/ServiceCard.liquid-glass.test.mjs apps/web/components/GlassSurface.tsx apps/web/app/glass.css apps/web/components/Header.tsx apps/web/components/Header.module.css
git commit -m "refactor(ui): share header liquid surface"
```

Expected: 공용 appearance와 헤더 연결만 포함한 Conventional Commit 1개가 생성된다.

### Task 2: 메인 02 섹션 아이콘 래퍼만 liquid variant로 전환

**파일:**
- Modify: `apps/web/components/ServiceCard.liquid-glass.test.mjs`
- Modify: `apps/web/components/ServiceCard.tsx`
- Modify: `apps/web/components/BusinessTypesSection.tsx`
- Modify: `apps/web/app/page.tsx`
- Verify: `apps/web/components/ServiceCard.module.css`
- Verify: `apps/web/app/about/page.tsx`
- Test: `apps/web/components/ServiceCard.liquid-glass.test.mjs`

**인터페이스:**
- Consumes: `GlassSurface appearance="header"` from Task 1.
- Produces: `ServiceCardIconFrameVariant = "plain" | "liquid"`.
- Produces: `BusinessTypesSectionProps.iconFrameVariant?: ServiceCardIconFrameVariant`, 기본값 `"plain"`.
- Produces: 홈 route의 `<BusinessTypesSection iconFrameVariant="liquid" />` opt-in.

- [ ] **Step 1: 홈 전용 liquid icon 계약을 테스트에 추가**

`apps/web/components/ServiceCard.liquid-glass.test.mjs` 끝에 다음 테스트를 추가한다.

```js
test("only the home BusinessTypes section uses header liquid icon frames", async () => {
  const [
    aboutPage,
    businessTypes,
    homePage,
    serviceCard,
    serviceCardStyles,
  ] = await Promise.all([
    readFile(aboutPagePath, "utf8"),
    readFile(businessTypesPath, "utf8"),
    readFile(homePagePath, "utf8"),
    readFile(serviceCardPath, "utf8"),
    readFile(serviceCardStylesPath, "utf8"),
  ]);

  assert.match(
    serviceCard,
    /export type ServiceCardIconFrameVariant = "plain" \| "liquid";/,
  );
  assert.match(serviceCard, /iconFrameVariant = "plain"/);
  assert.match(serviceCard, /import \{ GlassSurface \} from "\.\/GlassSurface";/);
  assert.match(
    serviceCard,
    /<GlassSurface[\s\S]*?appearance="header"[\s\S]*?as="span"[\s\S]*?bezel=\{9\}[\s\S]*?blur=\{8\}[\s\S]*?className=\{styles\.iconFrame\}[\s\S]*?radius=\{16\}[\s\S]*?refract[\s\S]*?saturate=\{1\.5\}[\s\S]*?scale=\{27\}/,
  );

  assert.match(
    businessTypes,
    /iconFrameVariant\?: ServiceCardIconFrameVariant;/,
  );
  assert.match(businessTypes, /iconFrameVariant = "plain"/);
  assert.match(
    businessTypes,
    /<ServiceCard[\s\S]*?iconFrameVariant=\{iconFrameVariant\}[\s\S]*?\{\.\.\.service\}/,
  );
  assert.match(
    homePage,
    /<BusinessTypesSection iconFrameVariant="liquid" \/>/,
  );
  assert.doesNotMatch(aboutPage, /iconFrameVariant="liquid"/);

  const iconFrameBlock = serviceCardStyles.match(
    /\.iconFrame\s*\{([^}]*)\}/,
  )?.[1];
  assert.ok(iconFrameBlock, "iconFrame style block is required");
  assert.match(iconFrameBlock, /width:\s*40px;/);
  assert.match(iconFrameBlock, /height:\s*40px;/);
  assert.match(iconFrameBlock, /border-radius:\s*16px;/);
  assert.doesNotMatch(iconFrameBlock, /background\s*:/);
  assert.doesNotMatch(iconFrameBlock, /box-shadow\s*:/);
});
```

- [ ] **Step 2: 테스트가 RED인지 확인**

Run:

```bash
node --test apps/web/components/ServiceCard.liquid-glass.test.mjs
```

Expected: 두 번째 테스트 FAIL. 아직 `ServiceCardIconFrameVariant`, `GlassSurface` icon wrapper, 홈 route opt-in이 없다.

- [ ] **Step 3: `ServiceCard`에 표시 variant 추가**

`apps/web/components/ServiceCard.tsx`에서 기존 import에 `GlassSurface`를 추가한다.

```tsx
import { GlassSurface } from "./GlassSurface";
import { Icon, type IconName } from "./Icon";
```

콘텐츠 데이터 타입은 유지하고 별도의 표시 variant를 정의한다.

```tsx
export type ServiceCardIconFrameVariant = "plain" | "liquid";

type ServiceCardProps = ServiceCardData & {
  iconFrameVariant?: ServiceCardIconFrameVariant;
};
```

함수 인자에서 기본값을 `plain`으로 둔다.

```tsx
export function ServiceCard({
  action,
  actionLabel = "자세히 보기",
  badge,
  description,
  headline,
  iconFrameVariant = "plain",
  iconName,
  title,
}: ServiceCardProps) {
  const hasHeader = Boolean(title || iconName || badge);
  const icon = iconName ? <Icon name={iconName} size={20} /> : null;
```

기존 `iconName` 분기를 다음으로 교체한다. 별도 `ButtonIcon`, `HeaderIcon`, `LiquidIconFrame` 컴포넌트는 만들지 않는다.

```tsx
              {icon ? (
                iconFrameVariant === "liquid" ? (
                  <GlassSurface
                    appearance="header"
                    as="span"
                    bezel={9}
                    blur={8}
                    className={styles.iconFrame}
                    radius={16}
                    refract
                    saturate={1.5}
                    scale={27}
                  >
                    {icon}
                  </GlassSurface>
                ) : (
                  <span className={styles.iconFrame}>{icon}</span>
                )
              ) : null}
```

`ServiceCard.module.css`의 `.iconFrame`은 40px 구조와 `currentColor` transition만 유지한다. liquid 외형을 중복 선언하지 않는다.

```css
.iconFrame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 16px;
  color: var(--color-gray-800);
  transition: color 220ms ease-in-out;
}
```

- [ ] **Step 4: `BusinessTypesSection`에서 variant를 전달**

`apps/web/components/BusinessTypesSection.tsx` import를 다음처럼 확장한다.

```tsx
import {
  ServiceCard,
  type ServiceCardData,
  type ServiceCardIconFrameVariant,
} from "./ServiceCard";
```

props와 기본값에 variant를 추가한다.

```tsx
type BusinessTypesSectionProps = {
  description?: ReactNode;
  iconFrameVariant?: ServiceCardIconFrameVariant;
  label?: string;
  order?: string;
  title?: ReactNode;
};
```

```tsx
export function BusinessTypesSection({
  description = (
    <>
      MVP 개발부터 하이브리드 앱, 기업 홈페이지, 강의 플랫폼, 온라인 쇼핑몰까지.
      <br />
      검증할 제품부터 자리 잡은 비즈니스의 무대까지, 필요한 만큼만 만듭니다.
    </>
  ),
  iconFrameVariant = "plain",
  label = "이런 걸 만듭니다",
  order = "02",
  title = "비즈니스 형태에 맞춰",
}: BusinessTypesSectionProps) {
```

서비스 카드 map에서 variant를 명시적으로 전달한다.

```tsx
        {services.map((service) => (
          <ServiceCard
            iconFrameVariant={iconFrameVariant}
            key={service.headline}
            {...service}
          />
        ))}
```

- [ ] **Step 5: 메인 페이지에서만 opt-in**

`apps/web/app/page.tsx`의 기존 호출을 다음 한 줄로 바꾼다.

```tsx
      <BusinessTypesSection iconFrameVariant="liquid" />
```

`apps/web/app/about/page.tsx`는 수정하지 않는다. 이 route는 prop을 전달하지 않으므로 `plain` 기본값을 사용한다.

- [ ] **Step 6: 홈 전용 liquid icon 테스트가 GREEN인지 확인**

Run:

```bash
node --test apps/web/components/ServiceCard.liquid-glass.test.mjs apps/web/components/click-interactions.test.mjs apps/web/app/page.test.mjs apps/web/app/about/page.test.mjs
```

Expected: 모든 테스트 PASS. 홈 route만 liquid icon frame을 요청하고 서비스 카드 링크/CTA 계약과 About route가 그대로 유지된다.

- [ ] **Step 7: 분리된 작업트리에서 홈 적용 커밋**

```bash
git add apps/web/components/ServiceCard.liquid-glass.test.mjs apps/web/components/ServiceCard.tsx apps/web/components/BusinessTypesSection.tsx apps/web/app/page.tsx
git commit -m "feat(home): add liquid glass service icons"
```

Expected: 홈 02 섹션 opt-in과 카드 variant만 포함한 Conventional Commit 1개가 생성된다.

### Task 3: 정적 검사와 브라우저 시각 검증

**파일:**
- Verify: `apps/web/components/GlassSurface.tsx`
- Verify: `apps/web/app/glass.css`
- Verify: `apps/web/components/Header.tsx`
- Verify: `apps/web/components/Header.module.css`
- Verify: `apps/web/components/ServiceCard.tsx`
- Verify: `apps/web/components/ServiceCard.module.css`
- Verify: `apps/web/components/BusinessTypesSection.tsx`
- Verify: `apps/web/app/page.tsx`
- Verify: `apps/web/app/about/page.tsx`

**인터페이스:**
- Consumes: Task 1의 `appearance="header"`와 Task 2의 홈 전용 `iconFrameVariant="liquid"`.
- Produces: 타입·lint·production build 결과와 desktop/mobile 브라우저 확인 결과.

- [ ] **Step 1: 전체 관련 Node 테스트 실행**

Run:

```bash
node --test apps/web/components/ServiceCard.liquid-glass.test.mjs apps/web/components/VideoBanner.liquid-glass.test.mjs apps/web/components/click-interactions.test.mjs apps/web/app/liquid-glass/page.test.mjs apps/web/app/page.test.mjs apps/web/app/about/page.test.mjs
```

Expected: 모든 테스트 PASS, uncaught exception 0건.

- [ ] **Step 2: lint와 타입 검사 실행**

Run:

```bash
pnpm --filter web lint
pnpm --filter web check-types
```

Expected: 두 명령 모두 exit code 0. ESLint warning과 TypeScript error가 없다.

- [ ] **Step 3: production build 실행**

Run:

```bash
pnpm --filter web build
```

Expected: Next.js가 `/`, `/about`을 포함한 모든 route를 성공적으로 생성하고 exit code 0으로 끝난다.

- [ ] **Step 4: desktop 메인 페이지 시각 검증**

Run:

```bash
pnpm --filter web dev
```

브라우저에서 `http://localhost:3000/`을 1440px viewport로 열어 다음을 확인한다.

- `02 이런 걸 만듭니다`의 MVP·하이브리드 앱·기업 홈페이지 아이콘 프레임 3개가 모두 40px 크기의 header light liquid glass로 보인다.
- 카드 제목, badge, 설명, CTA 위치가 변경 전과 같다.
- 카드 hover와 keyboard focus에서 아이콘은 `currentColor`로 밝아지고 liquid 표면이 깨지지 않는다.
- 상단 헤더 외형, dropdown, CTA, fixed 위치가 변경 전과 같다.
- 콘솔에 hydration, `ResizeObserver`, backdrop-filter 오류가 없다.

- [ ] **Step 5: mobile 및 About 회귀 검증**

메인 페이지를 390px viewport로 바꾸고 `/about`도 같은 폭과 1440px 폭에서 확인한다.

- 메인 서비스 카드가 1열로 전환되어도 liquid icon frame이 40px를 유지한다.
- 프레임 때문에 title group이 줄바꿈되거나 card 폭이 넘치지 않는다.
- `/about`의 재사용 서비스 카드 icon frame은 기존 plain 모양을 유지한다.
- 모바일 헤더는 64px 높이와 32px radius를 유지하고 메뉴 열기/닫기가 동작한다.

- [ ] **Step 6: 시각 검증 결과 반영 후 최종 회귀 검사**

시각 검증에서 수정이 발생했다면 Step 1~3 명령을 다시 실행한다.

Expected: Node 테스트, lint, type check, production build가 모두 다시 PASS하고, 새 `min-width`/`min-height`/child margin 선언이 없다.

## 자체 검토 결과

- 요구사항 범위: 메인 `02 이런 걸 만듭니다` 아이콘 래퍼, 헤더 liquid 외형 재사용, About 비적용, hover/focus, desktop/mobile 검증이 각각 Task 1~3에 연결되어 있다.
- 설계 규칙: 기존 `Icon`/`currentColor`를 재사용하고 로컬 아이콘 래퍼 컴포넌트, raster asset, child margin, 크기 강제용 `min-*`을 추가하지 않는다.
- 타입 일관성: `ServiceCardIconFrameVariant`를 `ServiceCard`가 정의하고 `BusinessTypesSection`이 그대로 소비하며, 홈은 문자열 literal `"liquid"`만 전달한다.
- 성능: 40px 프레임 3개는 동일한 geometry를 사용하므로 `glassFilter.ts`의 캐시에서 하나의 displacement map을 공유한다.
- 회귀 방지: 공용 header appearance의 원본 헤더, 기본 `GlassSurface`, About의 plain variant를 자동 테스트와 시각 검증에서 함께 확인한다.
