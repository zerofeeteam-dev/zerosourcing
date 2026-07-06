---
version: alpha
name: Pretendard Type Scale
description: Typography reference extracted from the provided design image.
fontFamily:
  base: Pretendard
  fallback: "Apple SD Gothic Neo", "Noto Sans KR", sans-serif
weights:
  M: 500
  B: 700
---

# Typography

`M` = `500`, `B` = `700`.

| Label                    | Token                  | Font       | Weight | Size | Line height |
| ------------------------ | ---------------------- | ---------- | -----: | ---: | ----------: |
| 프리텐다드 / M / 12 / 18 | `pretendard-medium-12` | Pretendard |    500 | 12px |        18px |
| 프리텐다드 / B / 12 / 18 | `pretendard-bold-12`   | Pretendard |    700 | 12px |        18px |
| 프리텐다드 / M / 14 / 21 | `pretendard-medium-14` | Pretendard |    500 | 14px |        21px |
| 프리텐다드 / B / 14 / 21 | `pretendard-bold-14`   | Pretendard |    700 | 14px |        21px |
| 프리텐다드 / M / 16 / 24 | `pretendard-medium-16` | Pretendard |    500 | 16px |        24px |
| 프리텐다드 / B / 16 / 24 | `pretendard-bold-16`   | Pretendard |    700 | 16px |        24px |
| 프리텐다드 / M / 18 / 26 | `pretendard-medium-18` | Pretendard |    500 | 18px |        26px |
| 프리텐다드 / B / 18 / 26 | `pretendard-bold-18`   | Pretendard |    700 | 18px |        26px |
| 프리텐다드 / M / 20 / 30 | `pretendard-medium-20` | Pretendard |    500 | 20px |        30px |
| 프리텐다드 / B / 20 / 30 | `pretendard-bold-20`   | Pretendard |    700 | 20px |        30px |
| 프리텐다드 / M / 22 / 32 | `pretendard-medium-22` | Pretendard |    500 | 22px |        32px |
| 프리텐다드 / B / 22 / 32 | `pretendard-bold-22`   | Pretendard |    700 | 22px |        32px |
| 프리텐다드 / M / 24 / 32 | `pretendard-medium-24` | Pretendard |    500 | 24px |        32px |
| 프리텐다드 / B / 24 / 32 | `pretendard-bold-24`   | Pretendard |    700 | 24px |        32px |
| 프리텐다드 / M / 28 / 36 | `pretendard-medium-28` | Pretendard |    500 | 28px |        36px |
| 프리텐다드 / B / 28 / 36 | `pretendard-bold-28`   | Pretendard |    700 | 28px |        36px |
| 프리텐다드 / M / 32 / 40 | `pretendard-medium-32` | Pretendard |    500 | 32px |        40px |
| 프리텐다드 / B / 32 / 40 | `pretendard-bold-32`   | Pretendard |    700 | 32px |        40px |

# Iconography

Icons must be implemented as SVG only. Do not use PNG, JPG, webfont, emoji, or rasterized icon sources for product UI icons.

Product UI icons must be registered in `apps/web/components/Icon.tsx` and rendered through the shared `Icon` component. Every product UI icon must use `currentColor` for stroke/fill by default.

Do not decide from a static Figma frame that an icon color is fixed. UI icons can later change by variant, hover, active, disabled, theme, dark mode, CTA style, or parent text color, so they must inherit color from their parent.

Fixed-color SVG assets are allowed only for non-UI graphics where color carries brand or semantic identity: logos, brand marks, partner/payment logos, flags, illustrations, and multi-color decorative graphics. These exceptions must remain asset SVGs and should not be registered as normal product UI icons.

Before adding a new icon, always check `apps/web/components/Icon.tsx` and `apps/web/components/icons.tsx` first. If an icon with the same name already exists, reuse the existing icon instead of downloading, duplicating, or creating another copy.

Do not create local wrapper components such as `ButtonIcon` or `HeaderIcon` inside pages/components.

```tsx
<Icon name="arrow-left" size={16} />
```

## 아이콘 규칙

- 모든 제품 UI 아이콘은 `apps/web/components/Icon.tsx`의 `Icon` 컴포넌트로 렌더링한다.
- 모든 제품 UI 아이콘은 기본적으로 `stroke="currentColor"` 또는 `fill="currentColor"`를 사용한다.
- 정적 Figma 화면만 보고 아이콘 색상이 고정이라고 판단하지 않는다.
- 고정색 예외는 로고, 브랜드마크, 파트너/결제사 로고, 국기, 일러스트, 다색 장식 그래픽으로 제한한다.
- 아이콘 SVG를 사용하되, 24px 박스에 `100%`로 꽉 채워 넣지 않는다.
- 래퍼는 기본 24px 고정이고, 특이한 경우에만 `frameSize`(아이콘 래퍼)로 개별 조정한다.
- 특수 케이스에서는 SVG 크기를 `glyphSize`로 보정한다.
- `object-fit: fill/cover` 같은 강제 확대 대신 `contain` 또는 고정 `width/height`로 비율을 유지한다.
- 아이콘 자체를 다른 타입의 텍스트/이미지와 같은 방식으로 다루지 않고, 레이아웃 간격 규칙(`padding`, `gap`, `center`)을 유지한다.

## Icons 규격

- 아이콘 registry 위치: `apps/web/components/Icon.tsx`
- Figma에서 받은 원본/백업 벡터 위치: `apps/web/components/icons.tsx`
- 신규 아이콘 추가 전 `apps/web/components/Icon.tsx`와 `apps/web/components/icons.tsx`에 동일 이름 아이콘이 있는지 먼저 확인한다.
- 동일 이름 아이콘이 이미 있으면 기존 아이콘을 꺼내서 사용하고, 중복 SVG 파일이나 색상별 아이콘을 만들지 않는다.
- UI에서 아이콘을 사용할 때는 `apps/web/components/Icon.tsx`의 `Icon` 컴포넌트를 사용한다.
- 특정 화면이나 컴포넌트 안에 `ButtonIcon`, `HeaderIcon` 같은 로컬 아이콘 래퍼를 만들지 않는다.
- 제품 UI용 색상별 아이콘 파일을 따로 만들지 않는다. `Icon`은 `currentColor`를 따르고, 색상은 부모 컴포넌트의 `color`로 제어한다.
- Figma SVG를 가져올 때 고정 `stroke`/`fill` 색상은 `currentColor`로 변환해 등록한다.
- 고정색 asset SVG는 제품 UI 아이콘 registry에 넣지 않고, 해당 그래픽을 쓰는 컴포넌트에서 명시적으로 사용한다.
- 사용 예시: `<Icon name="arrow-right" size={16} />`
- 원본/백업 파일 규격: `apps/web/components/icons.tsx`
- 파일 내 항목
  - 아이콘 타입: `FigmaIconAsset`
  - 아이콘 데이터 배열: `figmaArrowIcons`
  - 갤러리 컴포넌트: `FigmaArrowGallery`
  - 개별 아이콘 컴포넌트: `ArrowCurveLeftDownIcon`
- 컴포넌트명 규칙
  - 개별 아이콘 컴포넌트는 `*Icon` 접미사를 사용한다 (`ArrowCurveLeftDownIcon`).
  - 갤러리 컴포넌트는 `FigmaArrowGallery`를 사용한다.
- CSS 규격
  - 별도 모듈 파일을 사용하지 않고 `icons.tsx`의 `styles` 객체로 관리한다.

# Layout Spacing

Spacing between related UI elements must be handled with parent layout `gap` by default. Do not use child `margin` for normal spacing inside components, sections, grids, forms, buttons, input groups, or navigation layouts.

Use `margin` only for page-level exceptions where `gap` cannot express the layout relationship, such as external document flow, typography reset from third-party content, or isolated legacy fixes.

## 간격 규칙

- 컴포넌트 내부 간격은 부모의 `display: flex/grid`와 `gap`으로 조정한다.
- 섹션, 카드 목록, 폼 필드, 버튼 그룹, 아이콘/텍스트 간격도 기본적으로 `gap`을 사용한다.
- `margin-top`, `margin-bottom`, `margin-left`, `margin-right`로 일반 간격을 만들지 않는다.
- `margin`이 필요한 경우에는 해당 요소가 부모 layout의 `gap`으로 표현할 수 없는 예외인지 먼저 확인한다.

## 크기 제약 규칙

- 디자인 레이아웃을 잡기 위해 `min-width`와 `min-height`를 되도록 사용하지 않는다.
- 레이아웃 크기와 간격은 기본적으로 부모의 `padding`, `gap`, 컨텐츠 흐름으로 만든다.
- `min-width`나 `min-height`가 꼭 필요하면 구현 후 최종 응답에서 사용한 파일, selector, 이유를 명시한다.

# Button

Gradient buttons must use the shared `Button` component with `variant="gradient"`. Do not pass raw gradient colors from pages.

## 그라디언트 버튼 규칙

- 사용 예시: `<Button variant="gradient" color="blue">외주 문의하기</Button>`
- 허용 색상: `blue`, `black`, `yellow`
- 기본 색상: `blue`
- 색상별 gradient stop은 `packages/ui/src/button.tsx`의 design-system map에서만 관리한다.
- 개별 페이지나 컴포넌트에서 gradient button의 `background-image`, `background-clip`, `background-origin`을 직접 작성하지 않는다.
- CTA 버튼은 `Link`로 감싸거나 `Button` 내부에 `Link`를 넣지 않는다.
- CTA 동작은 반드시 `Button` 자체의 `onClick`에 연결한다. 페이지 이동이 필요한 일반 내비게이션 메뉴에만 `Link`를 사용한다.

# Glassmorphism

Glassmorphism styles must use the shared `glassSurface` utilities from `apps/web/app/glass.css`. Do not write one-off `backdrop-filter`, translucent background, border, or shadow values directly in page or component CSS when the shared glass style covers the case.

Use glass surfaces only for floating UI layers such as headers, toolbars, overlays, and panels. Keep component-specific CSS focused on layout, size, typography, and spacing.

## 글라스모피즘 규칙

- 기본 사용: `glassSurface`
- pill 형태의 header/toolbar: `glassSurfacePill`
- hover 반응이 필요한 glass surface: `glassSurfaceInteractive`
- 기본 Glass 설정은 Figma 기준 `Light -45deg / 80%`, `Refraction 80`, `Depth 20`, `Dispersion 50`, `Frost 20`, `Splay 0`을 따른다.
- `Frost 20`은 `backdrop-filter: blur(20px)`로 구현한다.
- `Light`, `Refraction`, `Depth`는 `apps/web/app/glass.css`의 shared token과 pseudo layer로만 구현한다.
- `Splay 0`이므로 색 분산 오프셋이나 레이어 밀림 효과를 추가하지 않는다.
- `backdrop-filter`는 반투명 배경과 함께 써야 효과가 보인다.
- 새 glass 변형이 필요하면 먼저 `apps/web/app/glass.css`의 토큰으로 해결 가능한지 확인한다.

# Figma Decoration

Do not implement Figma nodes named `Chrome Desktop` as product UI. Skip them during UI implementation because they are decorative browser top bars used only to make the design preview look like a desktop browser.

## 피그마 장식 요소 규칙

- `Chrome Desktop` UI는 구현하지 않는다.
- 브라우저 상단 탭, 주소창, 윈도우 프레임처럼 디자인 미리보기를 위해 배치된 장식 요소는 실제 서비스 UI에서 제외한다.
- 구현 대상은 브라우저 프레임 안쪽의 실제 제품 화면만 기준으로 한다.
