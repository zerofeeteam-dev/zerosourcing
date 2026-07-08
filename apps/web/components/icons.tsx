import type { CSSProperties, SVGProps } from "react";

export type FigmaIconAsset = {
  name: string;
  frameSize?: number;
  glyphSize?: number;
};

export const figmaArrowIcons: FigmaIconAsset[] = [
  {
    name: "arrow-curve-left-down",
  },
  {
    name: "arrow-curve-left-right",
  },
  {
    name: "arrow-curve-left-up",
  },
  {
    name: "arrow-down-left",
  },
  {
    name: "arrow-curve-up-left",
  },
  {
    name: "arrow-curve-right-up",
  },
  {
    name: "arrow-left-square-contained",
  },
  {
    name: "arrow-right-square-contained",
  },
  {
    name: "arrow-up-square-contained",
  },
  {
    name: "arrow-down-square-contained",
  },
  {
    name: "arrow-down-left-square-contained",
  },
  {
    name: "arrow-up-right-square-contained",
  },
  {
    name: "arrow-down-right-square-contained",
  },
  {
    name: "arrow-up-left-square-contained",
  },
  {
    name: "arrow-left-contained-02",
  },
  {
    name: "arrow-up-left-contained",
  },
  {
    name: "arrow-down-left-contained",
  },
  {
    name: "arrow-down-right-contained",
  },
  {
    name: "arrow-up-right-contained",
  },
  {
    name: "arrow-right-contained-02",
  },
  {
    name: "arrow-up-contained-02",
  },
  {
    name: "arrow-down-contained-02",
  },
  {
    name: "arrow-left-contained-01",
  },
  {
    name: "arrow-up-contained-01",
  },
  {
    name: "arrow-right-contained-01",
  },
  {
    name: "arrow-down-contained-01",
  },
  {
    name: "arrow-expand-01",
  },
  {
    name: "arrow-expand-02",
  },
  {
    name: "arrow-expand-03",
  },
  {
    name: "arrow-expand-04",
  },
  {
    name: "arrow-up",
  },
  {
    name: "down-arrow",
  },
  {
    name: "arrow-right",
  },
  {
    name: "arrow-left",
  },
  {
    name: "arrow-up-left",
  },
  {
    name: "arrow-down-right-b",
  },
  {
    name: "arrow-down-left",
  },
  {
    name: "arrow-up-right",
  },
  {
    name: "arrow-curve-up-right",
  },
  {
    name: "arrow-switch-horizontal",
  },
  {
    name: "arrow-switch-vertical",
  },
  {
    name: "arrow-refresh-01",
  },
  {
    name: "arrow-refresh-02",
  },
  {
    name: "arrow-refresh-03",
  },
  {
    name: "arrow-refresh-04",
  },
  {
    name: "arrow-refresh-05",
  },
  {
    name: "arrow-refresh-06",
  },
  {
    name: "arrow-rotate-left-01",
  },
  {
    name: "arrow-rotate-left-02",
  },
  {
    name: "arrow-rotate-right-01",
  },
  {
    name: "arrow-rotate-right-02",
  },
  {
    name: "chevron-double-down",
  },
  {
    name: "chevron-double-left",
  },
  {
    name: "chevron-double-right",
  },
  {
    name: "chevron-double-up",
  },
  {
    name: "chevron-down",
  },
  {
    name: "chevron-left",
  },
  {
    name: "chevron-right",
  },
  {
    name: "chevron-up",
  },
  {
    name: "flip-left",
  },
  {
    name: "flip-right",
  },
  {
    name: "arrow-up-sm",
    frameSize: 20,
    glyphSize: 14,
  },
  {
    name: "down-arrow-sm",
    frameSize: 20,
    glyphSize: 14,
  },
  {
    name: "arrow-right-sm",
    frameSize: 20,
    glyphSize: 14,
  },
  {
    name: "arrow-left-sm",
    frameSize: 20,
    glyphSize: 14,
  },
  {
    name: "arrow-up-left-sm",
    frameSize: 20,
    glyphSize: 14,
  },
  {
    name: "arrow-down-right-sm",
    frameSize: 20,
    glyphSize: 14,
  },
  {
    name: "arrow-down-left-sm",
    frameSize: 20,
    glyphSize: 14,
  },
  {
    name: "arrow-up-right-sm",
    frameSize: 20,
    glyphSize: 14,
  },
];

const DEFAULT_FRAME_SIZE = 24;
const DEFAULT_GLYPH_SIZE = 20;

type FigmaArrowGalleryProps = {
  icons?: FigmaIconAsset[];
  title?: string;
};

type LoadedIcon = FigmaIconAsset & {
  svgMarkup: string;
  isLoaded: boolean;
};

async function fetchSvgMarkup(src: string): Promise<string> {
  try {
    const response = await fetch(src, {
      headers: { Accept: "image/svg+xml" },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch {
    return "";
  }
}

async function loadIcons(icons: FigmaIconAsset[]): Promise<LoadedIcon[]> {
  return Promise.all(
    icons.map(async (icon) => {
      const svgMarkup = await fetchSvgMarkup(`/figma-icons/${icon.name}.svg`);

      return {
        ...icon,
        svgMarkup,
        isLoaded: Boolean(svgMarkup),
      };
    }),
  );
}

export async function FigmaArrowGallery({
  icons = figmaArrowIcons,
  title = "Figma 아이콘 미리보기",
}: FigmaArrowGalleryProps) {
  const iconList = await loadIcons(icons);

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>{title}</h2>
      <ul style={styles.grid}>
        {iconList.map((icon, index) => {
          const frameSize = icon.frameSize ?? DEFAULT_FRAME_SIZE;
          const glyphSize = icon.glyphSize ?? DEFAULT_GLYPH_SIZE;

          return (
            <li key={`${icon.name}-${index}`} style={styles.item}>
              <span
                style={{
                  ...styles.frame,
                  width: frameSize,
                  height: frameSize,
                  minWidth: frameSize,
                  minHeight: frameSize,
                }}
              >
                {icon.isLoaded ? (
                  <span
                    aria-hidden="true"
                    style={styles.glyph(glyphSize)}
                    dangerouslySetInnerHTML={{
                      __html: normalizeSvg(icon.svgMarkup, glyphSize),
                    }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    style={styles.fallback(glyphSize)}
                  />
                )}
              </span>
              <p style={styles.label}>{icon.name}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function normalizeSvg(svgMarkup: string, size: number): string {
  return svgMarkup.replace(/<svg([^>]*)>/i, (_, attrs: string) => {
    const withWidth = /\swidth="/i.test(attrs)
      ? attrs.replace(/\swidth="[^"]*"/i, ` width="${size}"`)
      : `${attrs} width="${size}"`;
    const withHeight = /\sheight="/i.test(withWidth)
      ? withWidth.replace(/\sheight="[^"]*"/i, ` height="${size}"`)
      : `${withWidth} height="${size}"`;

    return `<svg${withHeight}>`;
  });
}

export function ArrowCurveLeftDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      {...props}
    >
      <g id="arrow-curve-left-down">
        <path
          d="M8.91401 9.17198L3.6 14.486L8.91401 19.8M3.6 14.486H16.4C18.6091 14.486 20.4 12.6951 20.4 10.486V4.2"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

const styles: {
  section: CSSProperties;
  title: CSSProperties;
  grid: CSSProperties;
  item: CSSProperties;
  frame: CSSProperties;
  glyph: (size: number) => CSSProperties;
  fallback: (size: number) => CSSProperties;
  label: CSSProperties;
} = {
  section: {
    margin: "24px auto 0",
    maxWidth: 1200,
  },
  title: {
    margin: "0 0 16px",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.3,
    color: "#111827",
  },
  grid: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px 16px",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  frame: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: (size: number) => ({
    width: size,
    height: size,
    display: "block",
    objectFit: "contain",
  }),
  fallback: (size: number) => ({
    width: size,
    height: size,
    borderRadius: 4,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
  }),
  label: {
    margin: 0,
    fontSize: 11,
    lineHeight: 1.2,
    textAlign: "center",
    wordBreak: "break-word",
    color: "#3f4657",
  },
};

export default FigmaArrowGallery;

export const savedArrowIcons = figmaArrowIcons.slice(0, 10);
const savedArrowIconVectors = {
  "arrow-curve-left-down": {
    d: "M8.91401 9.17198L3.6 14.486L8.91401 19.8M3.6 14.486H16.4C18.6091 14.486 20.4 12.6951 20.4 10.486V4.2",
    groupId: "arrow-curve-left-down",
  },
  "arrow-curve-left-right": {
    d: "M15.086 9.17198L20.4 14.486L15.086 19.8M20.4 14.486H7.60001C5.39087 14.486 3.6 12.6951 3.6 10.486V4.2",
    groupId: "arrow-curve-left-right",
  },
  "arrow-curve-left-up": {
    d: "M8.91401 14.828L3.6 9.51401L8.91401 4.2M3.6 9.51401L16.4 9.51401C18.6091 9.51401 20.4 11.3049 20.4 13.514L20.4 19.8",
    groupId: "arrow-curve-left-up",
  },
  "arrow-down-left": {
    d: "M14.828 15.086L9.51401 20.4L4.2 15.086M9.51401 20.4L9.51401 7.60001C9.51401 5.39087 11.3049 3.6 13.514 3.6L19.8 3.6",
    groupId: "arrow-down-left",
  },
  "arrow-curve-up-left": {
    d: "M14.828 8.91401L9.51401 3.6L4.2 8.91401M9.51401 3.6L9.51401 16.4C9.51401 18.6091 11.3049 20.4 13.514 20.4L19.8 20.4",
    groupId: "arrow-curve-up-left",
  },
  "arrow-curve-right-up": {
    d: "M15.086 14.828L20.4 9.51401L15.086 4.2M20.4 9.51401L7.60001 9.51401C5.39087 9.51401 3.6 11.3049 3.6 13.514L3.6 19.8",
    groupId: "arrow-curve-right-up",
  },
  "arrow-left-square-contained": {
    d: "M11.376 8.02252L7.49997 12L11.376 15.9775M7.49997 12H16.0164M20.9999 6.37498L20.9999 17.625C20.9999 19.489 19.4889 21 17.6249 21H6.37498C4.51103 21 3 19.489 3 17.625V6.37498C3 4.51103 4.51103 3 6.37498 3H17.6249C19.4889 3 20.9999 4.51103 20.9999 6.37498Z",
    groupId: "arrow-left-square-contained",
  },
  "arrow-right-square-contained": {
    d: "M12.6239 15.9775L16.4999 12L12.6239 8.02252M16.4999 12H7.98347M3 17.625L3 6.37498C3 4.51103 4.51103 3 6.37498 3L17.6249 3C19.4889 3 20.9999 4.51103 20.9999 6.37498V17.625C20.9999 19.489 19.4889 21 17.6249 21H6.37498C4.51103 21 3 19.489 3 17.625Z",
    groupId: "arrow-right-square-contained",
  },
  "arrow-up-square-contained": {
    d: "M15.2813 14.3828V8.75772H9.65625M15.2813 8.75772L9.1875 14.8515M17.625 21L6.37498 21C4.51103 21 3 19.489 3 17.625L3 6.375C3 4.51104 4.51103 3 6.37498 3L17.625 3C19.489 3 21 4.51104 21 6.375V17.625C21 19.489 19.489 21 17.625 21Z",
    groupId: "arrow-up-square-contained",
  },
  "arrow-down-square-contained": {
    d: "M8.02255 12.6239L12.0001 16.5L15.9776 12.6239M12.0001 16.5L12.0001 7.9835M6.375 3L17.6251 3C19.4891 3 21.0001 4.51104 21.0001 6.375L21.0001 17.625C21.0001 19.489 19.4891 21 17.6251 21L6.375 21C4.51104 21 3 19.489 3 17.625L3 6.375C3 4.51104 4.51104 3 6.375 3Z",
    groupId: "arrow-down-square-contained",
  },
} as const;

type SavedIconRenderProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  pathData?: string;
  iconName?: string;
  size?: number;
};

export type SavedIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
};

export function SavedIcon({
  size = 20,
  pathData,
  iconName,
  ...props
}: SavedIconRenderProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      {...props}
      data-name={iconName}
    >
      <g id={iconName}>
        <path
          d={pathData ?? ""}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function createSavedIcon(iconName: keyof typeof savedArrowIconVectors) {
  const icon = savedArrowIconVectors[iconName];

  if (!icon) {
    throw new Error(`saved icon not found: ${iconName}`);
  }

  const SavedIconComponent = (props: SavedIconProps) => (
    <SavedIcon pathData={icon.d} iconName={icon.groupId} {...props} />
  );
  SavedIconComponent.displayName = `Saved${iconName
    .replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())
    .replace("-", "")}Icon`;

  return SavedIconComponent;
}

export const SavedArrowCurveLeftDownIcon = createSavedIcon("arrow-curve-left-down");
export const SavedArrowCurveLeftRightIcon = createSavedIcon(
  "arrow-curve-left-right",
);
export const SavedArrowCurveLeftUpIcon = createSavedIcon("arrow-curve-left-up");
export const SavedArrowDownLeftIcon = createSavedIcon("arrow-down-left");
export const SavedArrowCurveUpLeftIcon = createSavedIcon("arrow-curve-up-left");
export const SavedArrowCurveRightUpIcon = createSavedIcon("arrow-curve-right-up");
export const SavedArrowLeftSquareContainedIcon = createSavedIcon(
  "arrow-left-square-contained",
);
export const SavedArrowRightSquareContainedIcon = createSavedIcon(
  "arrow-right-square-contained",
);
export const SavedArrowUpSquareContainedIcon = createSavedIcon(
  "arrow-up-square-contained",
);
export const SavedArrowDownSquareContainedIcon = createSavedIcon(
  "arrow-down-square-contained",
);
