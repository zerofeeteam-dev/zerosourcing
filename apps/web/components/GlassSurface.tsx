"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { createElement, useLayoutEffect, useRef } from "react";

import { ensureGlassFilter, supportsGlassRefraction } from "./glassFilter";

type GlassStyle = CSSProperties & Record<`--${string}`, string | number>;

export interface GlassSurfaceProps {
  /**
   * Opt into the SVG refraction ("liquid") edge bend. Fine for hero surfaces
   * (the header) and small pills; avoid enabling it on many large panels at
   * once — each refracting element pays a per-frame backdrop cost in Chromium.
   * No-op on browsers that can't render it (falls back to the plain blur).
   */
  refract?: boolean;
  /** Corner radius in px. Defaults to a pill for refract, else the CSS default. */
  radius?: number;
  /** Refracted edge band width in px. Defaults to radius / 2 (clamped 8..24)
   *  so the lens stays proportional at any size. */
  bezel?: number;
  /** Displacement strength. Defaults to 3x the bezel, the original badge ratio. */
  scale?: number;
  /** Base backdrop blur in px. Overrides --zs-glass-blur for this instance. */
  blur?: number;
  /** Backdrop saturation multiplier applied alongside the refraction filter. */
  saturate?: number;
  /** Palette: "light" for white pages (default), "dark" for the original dark badge look. */
  tone?: "light" | "dark";
  /** Add hover feedback (brightens the fill). */
  interactive?: boolean;
  /** Element/component to render. Defaults to a div. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [key: string]: unknown;
}

const REFRACT_BLUR = 2;

export function GlassSurface({
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
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!refract) return;
    const el = ref.current;
    if (!el || !supportsGlassRefraction()) return;

    let timer = 0;
    const update = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (!width || !height) return;
      const id = ensureGlassFilter({
        width,
        height,
        radius,
        bezel,
        scale,
      });
      const value = `url("#${id}") blur(${blur ?? REFRACT_BLUR}px) saturate(${saturate})`;
      el.style.backdropFilter = value;
      (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
        value;
    };

    update();

    // Re-resolve the filter when the element's size settles. Debounced so a
    // window drag-resize doesn't mint a filter for every intermediate size;
    // the previous filter keeps rendering in the meantime.
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 120);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [refract, radius, bezel, scale, blur, saturate]);

  const classes = [
    "zsGlass",
    tone === "dark" ? "zsGlassDark" : "",
    interactive ? "zsGlassInteractive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const mergedStyle: GlassStyle = { ...(style as GlassStyle) };
  if (radius !== undefined) mergedStyle["--zs-glass-radius"] = `${radius}px`;
  if (blur !== undefined) mergedStyle["--zs-glass-blur"] = `${blur}px`;
  mergedStyle["--zs-glass-saturate"] = saturate;

  return createElement(
    as,
    { ref, className: classes, style: mergedStyle, ...rest },
    children,
  );
}
