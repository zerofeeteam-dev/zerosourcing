"use client";

import type { ComponentType, ElementType, ReactElement } from "react";

import { GlassSurface, type GlassSurfaceProps } from "./GlassSurface";

/** Glass settings accepted at wrap time and via the injected `glass` prop. */
export type GlassOptions = Omit<GlassSurfaceProps, "children" | "as">;

export interface WithGlassConfig extends GlassOptions {
  /**
   * By default the glass is applied directly to the wrapped component's root:
   * the component receives className/style (plus ref, which `refract` needs),
   * so it must spread those onto its root element. Set `wrap: true` (or an
   * element type such as "section") to render a GlassSurface wrapper element
   * around the component instead — no forwarding contract required, at the
   * cost of one extra DOM node that then owns the layout sizing.
   */
  wrap?: boolean | ElementType;
}

/**
 * Make any component a liquid-glass surface:
 *
 *   const GlassCard = withGlass(Card, { radius: 24 });
 *   const GlassBadge = withGlass(Badge, { refract: true, tone: "dark" });
 *   const GlassPanel = withGlass(LegacyPanel, { wrap: "section" });
 *
 * Per-instance overrides go through the injected `glass` prop:
 *
 *   <GlassCard glass={{ refract: true, radius: 32 }} {...cardProps} />
 */
export function withGlass<P extends object>(
  Component: ComponentType<P>,
  config: WithGlassConfig = {},
) {
  const { wrap, ...defaults } = config;

  function WithGlass({
    glass,
    ...props
  }: P & { glass?: GlassOptions }): ReactElement {
    if (wrap) {
      return (
        <GlassSurface as={wrap === true ? "div" : wrap} {...defaults} {...glass}>
          <Component {...(props as P)} />
        </GlassSurface>
      );
    }
    return (
      <GlassSurface as={Component} {...defaults} {...glass} {...(props as P)} />
    );
  }

  const name = Component.displayName ?? Component.name ?? "Component";
  WithGlass.displayName = `withGlass(${name})`;
  return WithGlass;
}
