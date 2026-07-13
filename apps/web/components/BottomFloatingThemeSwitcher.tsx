"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { Icon } from "./Icon";
import { supportsGlassRefraction } from "./glassFilter";
import { LIQUID_GLASS_MAP } from "./liquidGlassMap";
import styles from "./BottomFloatingThemeSwitcher.module.css";

type Theme = "light" | "dark" | "dim";

const GLASS_FILTER_ID = "zs-liquid-glass-switcher";

const themeOptions = [
  { label: "라이트 테마", name: "theme-light", value: "light" },
  { label: "다크 테마", name: "theme-dark", value: "dark" },
  { label: "딤 테마", name: "theme-dim", value: "dim" },
] as const;

export function BottomFloatingThemeSwitcher() {
  const groupName = useId();
  const switcherRef = useRef<HTMLFieldSetElement | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [previousTheme, setPreviousTheme] = useState<Theme>("light");

  useLayoutEffect(() => {
    const element = switcherRef.current;
    if (!element || !supportsGlassRefraction()) return;

    const filter = `blur(8px) url("#${GLASS_FILTER_ID}") saturate(var(--saturation))`;

    element.style.backdropFilter = filter;
    (
      element.style as CSSStyleDeclaration & {
        webkitBackdropFilter?: string;
      }
    ).webkitBackdropFilter = filter;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  const selectTheme = (nextTheme: Theme) => {
    if (nextTheme === theme) return;

    setPreviousTheme(theme);
    setTheme(nextTheme);
  };

  return (
    <fieldset
      className={styles.switcher}
      data-previous-theme={previousTheme}
      data-theme={theme}
      ref={switcherRef}
    >
      <legend className={styles.visuallyHidden}>테마 선택</legend>

      {themeOptions.map((option) => (
        <label className={styles.option} key={option.value}>
          <input
            aria-label={option.label}
            checked={theme === option.value}
            className={styles.input}
            name={groupName}
            onChange={() => selectTheme(option.value)}
            type="radio"
            value={option.value}
          />
          <span className={styles.iconFrame}>
            <Icon name={option.name} size={36} />
          </span>
        </label>
      ))}

      <span aria-hidden="true" className={styles.toggle} />

      <span aria-hidden="true" className={styles.filter}>
        <svg>
          <filter id={GLASS_FILTER_ID} primitiveUnits="objectBoundingBox">
            <feImage
              height="100%"
              href={LIQUID_GLASS_MAP}
              result="map"
              width="100%"
              x="0"
              y="0"
            />
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="0.04" />
            <feDisplacementMap
              in="blur"
              in2="map"
              scale="0.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      </span>
    </fieldset>
  );
}
