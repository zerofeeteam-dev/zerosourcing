# Video Banner Liquid Glass Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 유저 `VideoBanner`의 eyebrow 칩에 사용자가 지정한 `LiquidGlass` custom 설정으로 실제 배경 굴절을 적용한다.

**Architecture:** 이미 Client Component인 `VideoBanner.tsx`에서 `simple-liquid-glass@4.1.0`의 기본 `LiquidGlass` 컴포넌트로 기존 eyebrow 텍스트만 감싼다. 비디오와 CTA 구조는 유지하고, CSS Module은 크기·패딩·타이포그래피만 담당하며 굴절·frost·fallback은 라이브러리에 맡긴다. Chromium에서는 사용자가 지정한 강한 SVG displacement 설정을 사용하고, Safari/iOS/Firefox에서는 라이브러리의 frosted-glass fallback을 허용한다.

**Tech Stack:** Next.js 16.2, React 19.2, TypeScript, CSS Modules, `simple-liquid-glass@4.1.0`, Node test runner, pnpm

## Global Constraints

- UI 수정 전 `/Users/sangkun/nocoders/zerosourcing-v2/design.md`를 다시 읽고 typography·color token·spacing 규칙을 준수한다.
- 적용 범위는 `apps/web/components/VideoBanner.tsx`의 eyebrow 칩으로 제한한다. `Header`, `BottomCtaBanner`, CTA 버튼 및 다른 칩은 변경하지 않는다.
- 기존 `<video>`의 `autoPlay`, `loop`, `muted`, `playsInline`, `src`와 배너 레이아웃을 그대로 유지한다.
- eyebrow 텍스트와 현재의 비대화형 의미를 그대로 유지한다. 가짜 버튼, hover/click 동작, ARIA role을 추가하지 않는다.
- `simple-liquid-glass`는 `4.1.0`으로 정확히 고정한다. `/interactive` export와 Three.js/WebGL 계열 의존성은 추가하지 않는다.
- 실제 굴절은 Chromium 계열에서만 보인다. Safari/iOS/Firefox의 frosted fallback을 버그로 취급하지 않는다.
- 사용자가 제공한 props만 사용한다. `lens`, `liquid`, `mobileFallback`, `effectMode`, 색상 override를 임의로 추가하지 않는다.
- 별도 CSS animation이나 pointer interaction을 추가하지 않는다. 움직이는 비디오가 정적인 굴절면 아래로 지나가며 liquid 느낌을 만든다.
- 현재 작업 트리에 사용자 변경이 많고 `pnpm-lock.yaml`도 이미 수정되어 있다. 관련 없는 변경을 수정·복원·stage하지 않는다. 기존 변경과 분리할 수 없는 상태라면 아래 commit 단계는 건너뛰고 변경을 unstaged로 남긴다.

## Library Decision

선택: [`simple-liquid-glass@4.1.0`](https://github.com/lucaperullo/simple-liquid-glass)

- React 19 peer dependency와 Next.js SSR 사용을 공식 지원한다.
- Chromium에서 CSS blur가 아닌 실제 SVG displacement refraction을 만든다.
- 런타임 의존성이 없고 React core가 작아 40px 칩 하나에 적합하다.
- `scale={200}`, `displace={0.2}`, `aberrationIntensity={2}`로 영상의 색 경계가 분명하게 굴절된다.
- 단일 칩에 `quality="high"`를 사용하고, `autoTextColor`와 `forceTextColor`로 움직이는 영상 위의 텍스트 대비를 유지한다.

보류 후보:

- `@samasante/liquid-glass@0.1.1`: 비디오를 WebGL surface로 다시 렌더링하면 Safari/Firefox까지 실제 굴절이 가능하지만, 배너 전체 비디오 렌더링과 lens 좌표 측정 구조를 바꿔야 한다. 단일 칩 요구에는 변경 범위와 초기 버전 위험이 크다.
- `@specy/liquid-glass-react`: Three.js 기반이며 패키지 크기와 초기화 비용이 칩 하나에 과하다.
- `liquid-glass-react@1.1.1`: 현재 선택안보다 유지보수·SSR·브라우저 fallback 정보가 약하다.

---

### Task 1: Pin and verify the liquid-glass dependency

**Files:**
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: React `^19.2.0` and React DOM `^19.2.0` already owned by `apps/web`.
- Produces: named export `LiquidGlass` from `simple-liquid-glass` for `VideoBanner.tsx`.

- [ ] **Step 1: Re-read project UI rules and inspect the target diff**

Run:

```bash
sed -n '1,260p' design.md
git diff -- apps/web/components/VideoBanner.tsx apps/web/components/VideoBanner.module.css apps/web/package.json pnpm-lock.yaml
```

Expected: `design.md` confirms token/typography rules; the diff shows the existing manual glass CSS and any pre-existing lockfile changes that must be preserved.

- [ ] **Step 2: Install the exact package version in the web workspace**

Run:

```bash
pnpm --filter web add --save-exact simple-liquid-glass@4.1.0
```

Expected package manifest entry:

```json
"simple-liquid-glass": "4.1.0"
```

- [ ] **Step 3: Verify the package can be imported during SSR**

Run:

```bash
pnpm --filter web exec node --input-type=module -e "const module = await import('simple-liquid-glass'); if (!module.LiquidGlass) process.exit(1); console.log('LiquidGlass export ok')"
```

Expected:

```text
LiquidGlass export ok
```

- [ ] **Step 4: Review only the dependency diff**

Run:

```bash
git diff -- apps/web/package.json pnpm-lock.yaml
```

Expected: `simple-liquid-glass@4.1.0` and its lockfile metadata are added; unrelated pre-existing lockfile hunks remain untouched.

- [ ] **Step 5: Commit only if the dependency files were clean at task start**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "build(web): add liquid glass dependency"
```

If `pnpm-lock.yaml` contained pre-existing unstaged changes, do not run these commands; leave this task unstaged and report the overlap.

### Task 2: Replace the manual surface with library refraction

**Files:**
- Create: `apps/web/components/VideoBanner.liquid-glass.test.mjs`
- Modify: `apps/web/components/VideoBanner.tsx`
- Modify: `apps/web/components/VideoBanner.module.css`

**Interfaces:**
- Consumes: `LiquidGlass` from Task 1 and the existing `eyebrow?: string` prop.
- Produces: the same visible eyebrow text inside one `LiquidGlass` root with Chromium refraction and cross-browser fallback.

- [ ] **Step 1: Write the failing source contract test**

Create `apps/web/components/VideoBanner.liquid-glass.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./VideoBanner.tsx", import.meta.url);
const stylesPath = new URL("./VideoBanner.module.css", import.meta.url);
const packagePath = new URL("../package.json", import.meta.url);

test("VideoBanner eyebrow uses the liquid-glass library", async () => {
  const [component, styles, packageSource] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
    readFile(packagePath, "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource);
  const chip = component.match(/<LiquidGlass[\s\S]*?<\/LiquidGlass>/u)?.[0];

  assert.equal(packageJson.dependencies["simple-liquid-glass"], "4.1.0");
  assert.match(
    component,
    /import \{ LiquidGlass \} from "simple-liquid-glass";/u,
  );
  assert.ok(chip, "LiquidGlass eyebrow wrapper is missing");

  for (const expected of [
    'mode="custom"',
    'scale={200}',
    'radius={40}',
    'border={0.02}',
    'displace={0.2}',
    'blur={1}',
    'dispersion={15}',
    'saturation={160}',
    'aberrationIntensity={2}',
    'frost={0.05}',
    'autoTextColor',
    'forceTextColor',
    'quality="high"',
  ]) {
    assert.ok(chip.includes(expected), `Missing ${expected}`);
  }

  assert.match(
    chip,
    /<p className=\{styles\.eyebrow\}>\{eyebrow\}<\/p>/u,
  );
  assert.doesNotMatch(
    chip,
    /\blens=|\bliquid=|\bmobileFallback=|\beffectMode=|\balpha=|\bglassColor=|\bborderColor=|\blightness=/u,
  );
  assert.doesNotMatch(
    styles,
    /\.eyebrowChip::before|backdrop-filter|background-image/u,
  );
});
```

- [ ] **Step 2: Run the contract test and confirm it fails for the right reason**

Run:

```bash
pnpm --filter web exec node --test components/VideoBanner.liquid-glass.test.mjs
```

Expected: FAIL because `VideoBanner.tsx` does not import or render `LiquidGlass`, and the manual `backdrop-filter` implementation still exists.

- [ ] **Step 3: Import and render the base library component**

Add the package import near the existing component imports in `VideoBanner.tsx`:

```tsx
import { LiquidGlass } from "simple-liquid-glass";
```

Replace only the current eyebrow `<div>` block with:

```tsx
{eyebrow ? (
  <LiquidGlass
    className={styles.eyebrowChip}
    mode="custom"
    scale={200}
    radius={40}
    border={0.02}
    displace={0.2}
    blur={1}
    dispersion={15}
    saturation={160}
    aberrationIntensity={2}
    frost={0.05}
    autoTextColor
    forceTextColor
    quality="high"
  >
    <p className={styles.eyebrow}>{eyebrow}</p>
  </LiquidGlass>
) : null}
```

`className`은 기존 layout과 typography 연결에만 사용한다. 광학 수치는 사용자가 제공한 값을 그대로 유지하고 별도 색상·animation·lens props를 추가하지 않는다.

- [ ] **Step 4: Reduce the CSS Module to layout and typography ownership**

Replace the current `.eyebrowChip`, `.eyebrowChip::before`, `.eyebrow`, and `@supports` block with:

```css
.eyebrowChip {
  display: inline-flex;
  width: max-content;
  height: 40px;
  padding: 8px 16px;
  align-items: center;
  justify-content: center;
}

.eyebrow {
  composes: pretendard-medium-14 from global;
  color: var(--color-gray-800);
  white-space: nowrap;
}
```

Do not add local `font-*`, a duplicate filter, pseudo-element highlight, custom keyframes, or a CSS fallback; those concerns now belong to the library.

- [ ] **Step 5: Run the focused test and type checks**

Run:

```bash
pnpm --filter web exec node --test components/VideoBanner.liquid-glass.test.mjs
pnpm --filter web check-types
pnpm --filter web lint
```

Expected: all commands PASS with no hydration, TypeScript, or lint errors.

- [ ] **Step 6: Run the full web test suite**

Run:

```bash
pnpm --filter web test
```

Expected: all existing unit and node tests PASS, including `Header.surface.test.mjs`; the Header remains explicitly non-liquid-glass.

- [ ] **Step 7: Commit only the scoped component work when isolation is safe**

```bash
git add apps/web/components/VideoBanner.tsx apps/web/components/VideoBanner.module.css apps/web/components/VideoBanner.liquid-glass.test.mjs
git commit -m "feat(ui): add liquid glass video banner chip"
```

If the target files contained unrelated pre-existing edits, skip the commit and report the overlap instead of staging them.

### Task 3: Verify the liquid effect on the real video banner

**Files:**
- Verify: `apps/web/components/VideoBanner.tsx`
- Verify: `apps/web/components/VideoBanner.module.css`
- Verify: all routes that render the shared `VideoBanner`

**Interfaces:**
- Consumes: the finished `LiquidGlass` chip from Task 2.
- Produces: an evidence-backed visual verdict for desktop, mobile, motion reduction, and fallback behavior.

- [ ] **Step 1: Start the user web app**

Run:

```bash
pnpm --filter web dev
```

Expected: Next.js serves the app at `http://localhost:3000` with no startup error.

- [ ] **Step 2: Verify Chromium desktop at 1280px width**

Open `http://localhost:3000/` and confirm all of the following:

- the blue video shapes visibly bend through the chip instead of merely blurring;
- the central label remains crisp and readable;
- 별도 wobble이나 위치 animation 없이 움직이는 비디오가 굴절면 아래로 지나간다;
- the chip remains 40px high and centered above the title;
- the video and CTA buttons behave exactly as before;
- the console contains no hydration, filter-ID, ResizeObserver, or React errors.

굴절이 보이지 않으면 값을 조정하지 말고 먼저 Chromium 여부와 computed `backdrop-filter`에 SVG filter URL이 적용됐는지 확인한다. 지정된 수치를 임의로 변경하거나 두 번째 CSS filter를 추가하지 않는다.

- [ ] **Step 3: Verify responsive Chromium at 375×812**

Confirm:

- the chip stays within the viewport with no horizontal overflow;
- eyebrow text stays on one line at the current production copy length;
- scrolling and the background video remain smooth.

`mobileFallback`은 지정하지 않았으므로 라이브러리 기본값에 따라 모바일에서는 CSS-only fallback이 사용될 수 있다. 이 동작을 실패로 처리하거나 임의로 SVG를 강제하지 않는다.

- [ ] **Step 4: Verify every shared VideoBanner route**

Check these routes at desktop width:

```text
/
/about
/service/mvp
/service/app
/service/company-homepage
```

Expected: the shared eyebrow chip is visually consistent; titles, descriptions, alignment variants, buttons, and banner height are unchanged.

- [ ] **Step 5: Record the browser limitation in the handoff**

Report exactly:

```text
Chromium uses real SVG displacement refraction. Safari, iOS, and Firefox use the library's frosted-glass fallback because those engines do not support SVG filters in backdrop-filter.
```

If product requirements later demand real video refraction in Safari/Firefox, create a separate plan for `@samasante/liquid-glass` WebGL video-surface mode rather than expanding this task.

## Final Verification Checklist

- [ ] `simple-liquid-glass` is pinned to `4.1.0`.
- [ ] Only the `VideoBanner` eyebrow chip uses the package.
- [ ] The previous manual blur, pseudo-element shine, and fallback CSS are removed.
- [ ] Chromium visibly bends the moving video through the chip.
- [ ] Text, CTA actions, video attributes, and route layouts remain unchanged.
- [ ] No additional liquid animation or pointer interaction is introduced.
- [ ] `pnpm --filter web test`, `check-types`, and `lint` pass.
- [ ] Unrelated dirty-worktree changes remain untouched and unstaged.

## Primary References

- Package README: https://github.com/lucaperullo/simple-liquid-glass
- Package API reference: https://raw.githubusercontent.com/lucaperullo/simple-liquid-glass/main/llms.txt
- npm package: https://www.npmjs.com/package/simple-liquid-glass
