# Liquid Glass Banner Chip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma의 Liquid Glass 값과 제공된 pill 레이아웃을 `VideoBanner`의 공용 eyebrow chip에 재현한다.

**Architecture:** 기존 `GlassSurface`와 공유 SVG displacement filter는 유지하고, Figma 원본 값과 웹 렌더링 값을 묶은 `figma-light` 프리셋만 추가한다. 프리셋은 chip에만 적용해 현재 헤더와 다른 glass 표면의 기본 렌더링을 바꾸지 않으며, chip의 레이아웃은 `VideoBanner.module.css`가 소유한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, CSS custom properties, SVG `feDisplacementMap`, Node test runner

**Target Assumption:** 제공된 `24px content + 8px padding` 규격은 현재 `VideoBanner`의 eyebrow chip을 가리키는 것으로 확정한다. 헤더 전체나 일반 카드 표면으로 확대하지 않는다.

## Global Constraints

- 구현 전후 모두 `design.md`의 타이포그래피, 컬러 토큰, 아이콘, 간격 규칙을 따른다.
- 제품 UI 아이콘이 필요하면 기존 `apps/web/components/Icon.tsx`만 사용한다. 이번 범위에서는 신규 아이콘과 asset을 추가하지 않는다.
- Figma 원본 값은 Light `-45deg / 80%`, Refraction `80`, Depth `20`, Dispersion `50`, Frost `10`, Splay `0`으로 보존한다.
- Figma 효과 값은 CSS px 값과 같은 단위가 아니므로 원본 값과 브라우저 렌더링 환산값을 별도로 저장한다.
- 제공된 `height: 24px; padding: 8px`는 24px content 영역과 상하 8px padding, 즉 최종 40px 높이로 해석한다. 전역 `box-sizing: border-box` 환경에서는 `.eyebrowChip { height: 40px; padding: 8px; }`로 구현한다.
- `rgba(27, 31, 42, 0.04)`는 `--color-gray-800`을 기반으로 한 `color-mix(in srgb, var(--color-gray-800) 4%, transparent)`로 표현한다.
- 기존 `Header`의 `GlassSurface` 기본값과 다른 페이지의 local `backdrop-filter`는 이 작업에서 변경하지 않는다.
- 신규 패키지를 설치하지 않는다.
- 현재 worktree의 다른 미커밋 변경은 수정하거나 stage하지 않는다.

---

## File Structure

- Create: `apps/web/components/glassPresets.ts` — Figma 원본 값과 브라우저용 환산값을 한 곳에서 관리한다.
- Modify: `apps/web/components/GlassSurface.tsx` — `preset="figma-light"`를 받아 기존 filter/CSS 변수에 연결한다.
- Modify: `apps/web/app/glass.css` — `figma-light` 전용 light, depth, dispersion, splay modifier를 정의한다.
- Modify: `apps/web/components/VideoBanner.tsx` — eyebrow chip의 root를 `GlassSurface`로 바꾼다.
- Modify: `apps/web/components/VideoBanner.module.css` — 제공된 flex, 40px rendered height, 8px padding, 4px gap, 32px radius, 4% tint를 적용한다.
- Create: `apps/web/components/VideoBanner.liquid-glass.test.mjs` — 프리셋 값, 적용 위치, box-model 계약을 회귀 테스트한다.
- Modify: `design.md` — 이 저장소에서 사용하는 Liquid Glass 프리셋과 적용 범위를 문서화한다.

---

### Task 1: Liquid Glass 계약을 테스트로 고정

**Files:**

- Create: `apps/web/components/VideoBanner.liquid-glass.test.mjs`

**Interfaces:**

- Consumes: 현재 `VideoBanner.tsx`, `VideoBanner.module.css`, `GlassSurface.tsx`, `glassPresets.ts`, `glass.css`의 소스 파일
- Produces: `figma-light` 값과 banner chip 적용 규칙을 검증하는 Node test

- [ ] **Step 1: 실패하는 소스 계약 테스트 작성**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bannerPath = new URL("./VideoBanner.tsx", import.meta.url);
const bannerStylesPath = new URL("./VideoBanner.module.css", import.meta.url);
const surfacePath = new URL("./GlassSurface.tsx", import.meta.url);
const presetsPath = new URL("./glassPresets.ts", import.meta.url);
const glassStylesPath = new URL("../app/glass.css", import.meta.url);

test("figma light glass preset preserves the source values", async () => {
  const presets = await readFile(presetsPath, "utf8");

  assert.match(presets, /lightAngle:\s*-45/);
  assert.match(presets, /lightIntensity:\s*80/);
  assert.match(presets, /refraction:\s*80/);
  assert.match(presets, /depth:\s*20/);
  assert.match(presets, /dispersion:\s*50/);
  assert.match(presets, /frost:\s*10/);
  assert.match(presets, /splay:\s*0/);
});

test("GlassSurface exposes the isolated figma-light preset", async () => {
  const [surface, glassStyles] = await Promise.all([
    readFile(surfacePath, "utf8"),
    readFile(glassStylesPath, "utf8"),
  ]);

  assert.match(surface, /preset\?: GlassPresetName/);
  assert.match(surface, /presetDefinition\?\.className/);
  assert.match(glassStyles, /\.zsGlassFigmaLight/);
});

test("VideoBanner applies liquid glass to the 40px eyebrow chip", async () => {
  const [banner, styles] = await Promise.all([
    readFile(bannerPath, "utf8"),
    readFile(bannerStylesPath, "utf8"),
  ]);

  assert.match(
    banner,
    /<GlassSurface[\s\S]*?preset="figma-light"[\s\S]*?refract/,
  );
  assert.match(
    styles,
    /\.eyebrowChip\s*\{[\s\S]*?height:\s*40px;[\s\S]*?padding:\s*8px;[\s\S]*?gap:\s*4px;/,
  );
  assert.match(
    styles,
    /background-color:\s*color-mix\(in srgb, var\(--color-gray-800\) 4%, transparent\);/,
  );
});
```

- [ ] **Step 2: 테스트가 예상대로 실패하는지 확인**

Run:

```bash
node --test apps/web/components/VideoBanner.liquid-glass.test.mjs
```

Expected: `glassPresets.ts`가 아직 없거나 `preset="figma-light"`가 없어서 FAIL.

- [ ] **Step 3: 테스트 파일만 커밋**

```bash
git add apps/web/components/VideoBanner.liquid-glass.test.mjs
git commit -m "test(web): define liquid glass badge contract"
```

---

### Task 2: Figma 값을 독립 프리셋으로 연결

**Files:**

- Create: `apps/web/components/glassPresets.ts`
- Modify: `apps/web/components/GlassSurface.tsx`
- Modify: `apps/web/app/glass.css`
- Test: `apps/web/components/VideoBanner.liquid-glass.test.mjs`

**Interfaces:**

- Consumes: 기존 `GlassSurfaceProps`의 `radius`, `bezel`, `scale`, `blur`, `saturate`, `tone`, `refract`
- Produces: `GlassPresetName`, `GLASS_PRESETS`, `GlassSurfaceProps.preset`

- [ ] **Step 1: Figma 원본 값과 웹 환산값 정의**

Create `apps/web/components/glassPresets.ts`:

```ts
export const GLASS_PRESETS = {
  "figma-light": {
    className: "zsGlassFigmaLight",
    source: {
      lightAngle: -45,
      lightIntensity: 80,
      refraction: 80,
      depth: 20,
      dispersion: 50,
      frost: 10,
      splay: 0,
    },
    render: {
      radius: 32,
      bezel: 10,
      scale: 30,
      blur: 2,
      saturate: 1.4,
      lightAngle: "-45deg",
      lightIntensity: 0.8,
      depth: 0.2,
      dispersion: 0.5,
      splay: "0px",
    },
  },
} as const;

export type GlassPresetName = keyof typeof GLASS_PRESETS;
```

The `source` object is immutable design truth. The `render` object is the browser translation and is the only place adjusted during visual calibration. Refraction `80` does not become an 80px SVG displacement; the initial `scale: 30` preserves the existing 40px badge geometry ratio (`bezel: 10`, `scale: 30`). Frost `10` starts at the current `2px` blur and is visually calibrated against the reference.

- [ ] **Step 2: `GlassSurface`에 preset을 추가하되 명시적 prop override를 우선**

Update `apps/web/components/GlassSurface.tsx` so the priority is `instance prop > preset render value > existing default`.

Add the import and prop type:

```tsx
import { GLASS_PRESETS, type GlassPresetName } from "./glassPresets";

export interface GlassSurfaceProps {
  preset?: GlassPresetName;
}
```

In the existing `GlassSurface` parameter destructuring, insert `preset` before `refract` and change `saturate = 1.4` to `saturate`:

```tsx
export function GlassSurface({
  preset,
  refract = false,
  radius,
  bezel,
  scale,
  blur,
  saturate,
  tone = "light",
  interactive = false,
  as = "div",
  className = "",
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
```

Immediately after the existing `ref` declaration, add:

```tsx
const presetDefinition = preset ? GLASS_PRESETS[preset] : undefined;
const presetRender = presetDefinition?.render;
const resolvedRadius = radius ?? presetRender?.radius;
const resolvedBezel = bezel ?? presetRender?.bezel;
const resolvedScale = scale ?? presetRender?.scale;
const resolvedBlur = blur ?? presetRender?.blur;
const resolvedSaturate = saturate ?? presetRender?.saturate ?? 1.4;
```

Replace the arguments passed to `ensureGlassFilter` with:

```tsx
const id = ensureGlassFilter({
  width,
  height,
  radius: resolvedRadius,
  bezel: resolvedBezel,
  scale: resolvedScale,
});
const value = `url("#${id}") blur(${resolvedBlur ?? REFRACT_BLUR}px) saturate(${resolvedSaturate})`;
```

Use this exact effect dependency list:

```tsx
}, [
  refract,
  resolvedRadius,
  resolvedBezel,
  resolvedScale,
  resolvedBlur,
  resolvedSaturate,
]);
```

Insert the preset class between the base class and tone class:

```tsx
const classes = [
  "zsGlass",
  presetDefinition?.className,
  tone === "dark" ? "zsGlassDark" : "",
  interactive ? "zsGlassInteractive" : "",
  className,
]
  .filter(Boolean)
  .join(" ");
```

The final merged custom properties are:

```tsx
if (resolvedRadius !== undefined) {
  mergedStyle["--zs-glass-radius"] = `${resolvedRadius}px`;
}
if (resolvedBlur !== undefined) {
  mergedStyle["--zs-glass-blur"] = `${resolvedBlur}px`;
}
mergedStyle["--zs-glass-saturate"] = resolvedSaturate;

if (presetRender) {
  mergedStyle["--zs-glass-light-angle"] = presetRender.lightAngle;
  mergedStyle["--zs-glass-light-intensity"] = presetRender.lightIntensity;
  mergedStyle["--zs-glass-depth"] = presetRender.depth;
  mergedStyle["--zs-glass-dispersion-opacity"] = presetRender.dispersion;
  mergedStyle["--zs-glass-splay"] = presetRender.splay;
}
```

The `useLayoutEffect` dependency list must use the resolved primitive values so preset changes and explicit overrides both regenerate the correct filter.

- [ ] **Step 3: `figma-light` modifier CSS 추가**

Append an isolated modifier to `apps/web/app/glass.css`; do not rewrite the root defaults used by `Header`:

```css
.zsGlassFigmaLight {
  --zs-glass-light-angle: -45deg;
  --zs-glass-light-intensity: 0.8;
  --zs-glass-depth: 0.2;
  --zs-glass-dispersion-opacity: 0.5;
  --zs-glass-splay: 0px;
  --zs-glass-center: rgb(255 255 255 / 4%);
  --zs-glass-mid: rgb(255 255 255 / 8%);
  --zs-glass-edge: rgb(255 255 255 / 20%);
  --zs-glass-hairline: rgb(255 255 255 / 32%);
  --zs-glass-inner-glow: rgb(255 255 255 / 24%);
  --zs-glass-inner-shade: rgb(27 31 42 / var(--zs-glass-depth));
  --zs-glass-drop-far: rgb(27 31 42 / 12%);
  --zs-glass-drop-near: rgb(27 31 42 / 8%);
}

.zsGlassFigmaLight::before,
.zsGlassFigmaLight::after {
  inset: calc(var(--zs-glass-splay) * -1);
}

.zsGlassFigmaLight::before {
  background: linear-gradient(
    var(--zs-glass-light-angle),
    rgb(255 255 255 / var(--zs-glass-light-intensity)) 0%,
    rgb(255 255 255 / 18%) 42%,
    rgb(255 255 255 / 0%) 70%
  );
}
```

Keep the existing `.zsGlass::after` chromatic ring; the preset supplies `0.5`, which is the direct web mapping of Figma Dispersion `50`.

- [ ] **Step 4: 프리셋 관련 테스트를 다시 실행**

Run:

```bash
node --test --test-name-pattern='figma light glass preset|GlassSurface exposes' apps/web/components/VideoBanner.liquid-glass.test.mjs
pnpm --filter web check-types
```

Expected: preset/source-value tests 2개 PASS, banner application test 1개 SKIP, typecheck PASS.

- [ ] **Step 5: 프리셋 구현만 커밋**

```bash
git add apps/web/components/glassPresets.ts apps/web/components/GlassSurface.tsx apps/web/app/glass.css
git commit -m "feat(web): add figma liquid glass preset"
```

---

### Task 3: VideoBanner eyebrow chip에 프리셋 적용

**Files:**

- Modify: `apps/web/components/VideoBanner.tsx`
- Modify: `apps/web/components/VideoBanner.module.css`
- Test: `apps/web/components/VideoBanner.liquid-glass.test.mjs`

**Interfaces:**

- Consumes: `GlassSurface`의 `preset="figma-light"`와 기존 `eyebrow` string
- Produces: 모든 `VideoBanner` 사용처에서 동일하게 렌더링되는 40px Liquid Glass chip

- [ ] **Step 1: eyebrow root를 `GlassSurface`로 교체**

Add the import:

```tsx
import { GlassSurface } from "./GlassSurface";
```

Replace only the eyebrow wrapper:

```tsx
<div className={styles.copy}>
  {eyebrow ? (
    <GlassSurface
      as="div"
      className={styles.eyebrowChip}
      preset="figma-light"
      refract
    >
      <p className={styles.eyebrow}>{eyebrow}</p>
    </GlassSurface>
  ) : null}
  <div className={styles.text}>
    <h1 className={styles.title}>{title}</h1>
    {description ? <p className={styles.description}>{description}</p> : null}
  </div>
</div>
```

Do not add a second SVG filter or local canvas hook. The existing shared `glassFilter.ts` remains the only displacement implementation.

- [ ] **Step 2: 제공된 layout 값을 border-box 환경에 맞게 적용**

Replace `.eyebrowChip` in `apps/web/components/VideoBanner.module.css`:

```css
.eyebrowChip {
  height: 40px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  border-radius: 32px;
  background-color: color-mix(in srgb, var(--color-gray-800) 4%, transparent);
}

.eyebrow {
  composes: pretendard-medium-14 from global;
  position: relative;
  z-index: 3;
  color: var(--color-gray-800);
  white-space: nowrap;
}
```

Use `background-color`, not the `background` shorthand, so the local 4% tint does not erase the gradient supplied by `.zsGlass`.

- [ ] **Step 3: 전체 liquid-glass 계약 테스트 실행**

Run:

```bash
node --test apps/web/components/VideoBanner.liquid-glass.test.mjs
```

Expected: 3 tests PASS.

- [ ] **Step 4: chip 적용 변경만 커밋**

```bash
git add apps/web/components/VideoBanner.tsx apps/web/components/VideoBanner.module.css
git commit -m "feat(web): apply liquid glass to banner badge"
```

---

### Task 4: 디자인 시스템 문서화와 정적 검증

**Files:**

- Modify: `design.md`

**Interfaces:**

- Consumes: 구현된 `figma-light` preset 계약
- Produces: 다음 UI 작업에서 임의 glass 값을 중복 작성하지 않게 하는 저장소 규칙

- [ ] **Step 1: `design.md`에 Liquid Glass 규칙 추가**

Append:

```md
# Liquid Glass

- Liquid Glass는 `apps/web/components/GlassSurface.tsx`를 통해서만 적용한다.
- Figma Light preset은 `preset="figma-light"`를 사용한다.
- 원본 값은 Light -45deg / 80%, Refraction 80, Depth 20,
  Dispersion 50, Frost 10, Splay 0이다.
- 원본 값은 CSS px과 동일한 단위가 아니며, 브라우저 환산값은
  `apps/web/components/glassPresets.ts`에서만 조정한다.
- SVG displacement filter나 canvas map을 화면 컴포넌트에 중복 구현하지 않는다.
- Refraction은 Chromium에서만 활성화될 수 있으며 Safari/Firefox에서는
  CSS blur/fill fallback이 동일한 콘텐츠 가독성을 유지해야 한다.
- 대형 표면 여러 개에 refraction을 동시에 적용하지 않는다.
```

- [ ] **Step 2: lint, typecheck, build 실행**

Run:

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```

Expected: all commands exit 0 with no warnings treated as errors.

- [ ] **Step 3: glass 구현 중복 여부 재검색**

Run:

```bash
rg -n "glassMapUri|use-liquid-glass|feDisplacementMap|backdrop-filter|zsGlassFigmaLight" apps/web
```

Expected:

- `feDisplacementMap` generation remains centralized in `apps/web/components/glassFilter.ts`.
- `zsGlassFigmaLight` is defined once in `apps/web/app/glass.css`.
- `VideoBanner.tsx` contains no local SVG/canvas implementation.
- Existing unrelated `backdrop-filter` declarations are reported but unchanged.

- [ ] **Step 4: 문서 변경 커밋**

```bash
git add design.md
git commit -m "docs(design): document liquid glass preset"
```

---

### Task 5: 실제 화면 시각 검증

**Files:**

- Verify only; change files only if screenshot comparison identifies a mismatch

**Interfaces:**

- Consumes: built web app and the provided Figma effect screenshot
- Produces: viewport and browser별 visual acceptance record

- [ ] **Step 1: 기존 dev server 상태 확인 후 하나만 사용**

Run:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

If no process owns port 3000, run:

```bash
pnpm --filter web dev
```

Do not start a second Next dev server if the first server is healthy.

- [ ] **Step 2: Chromium에서 공용 chip 사용처 확인**

Check these routes at 1440px, 768px, and 390px widths:

```text
/
/about
/service/mvp
/service/app
/service/company-homepage
```

Acceptance criteria:

- rendered chip height is 40px;
- horizontal/vertical padding is 8px and internal gap is 4px;
- radius is 32px;
- tint remains `gray-800` at 4% without hiding the glass gradient;
- text remains above the rim/dispersion layers and is readable on light and moving video frames;
- refraction is visible at the chip edge without moving or clipping the text;
- no horizontal overflow occurs for the longest eyebrow copy at 390px.

- [ ] **Step 3: Safari 또는 Firefox fallback 확인**

Acceptance criteria:

- the SVG refraction may be absent;
- the chip retains 4% tint, blur/fill, 32px radius, and readable text;
- no transparent or black rectangle replaces the chip.

- [ ] **Step 4: Figma와 다른 경우 render 값만 보정**

Adjust only `GLASS_PRESETS["figma-light"].render` values in `glassPresets.ts`. Never change the canonical `source` values. Re-run:

```bash
node --test apps/web/components/VideoBanner.liquid-glass.test.mjs
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```

- [ ] **Step 5: 최종 diff 범위 확인**

Run:

```bash
git diff --check
git status --short
```

Expected: only the seven files listed in this plan are part of this feature; pre-existing unrelated worktree changes remain untouched.

---

## Definition of Done

- `VideoBanner` eyebrow chip이 모든 사용 페이지에서 동일한 40px Liquid Glass pill로 렌더링된다.
- Figma 원본 값과 웹 렌더링 환산값이 분리돼 있다.
- 기존 `Header`와 다른 glass 표면의 기본 렌더링이 바뀌지 않는다.
- Chromium refraction과 Safari/Firefox fallback을 각각 확인했다.
- Node contract test, lint, typecheck, build가 모두 통과했다.
- 시각 검증 캡처를 확인하기 전에는 완료로 보고하지 않는다.
