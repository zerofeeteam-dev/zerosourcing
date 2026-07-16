"use client";

import type { CSSProperties } from "react";
import dynamic from "next/dynamic";

import styles from "./BannerEyebrowChip.module.css";

const LiquidGlass = dynamic(
  () =>
    import("simple-liquid-glass").then((module) => module.LiquidGlass),
  { ssr: false },
);

const chipStyle = {
  height: 40,
  width: "max-content",
} satisfies CSSProperties;

type BannerEyebrowChipProps = {
  children: string;
};

export function BannerEyebrowChip({ children }: BannerEyebrowChipProps) {
  return (
    <LiquidGlass
      aberrationIntensity={2}
      autoTextColor
      blur={3}
      borderColor="rgb(255, 255, 255)"
      className={styles.chip}
      displace={1.2}
      dispersion={110}
      forceTextColor
      frost={0.25}
      mode="custom"
      quality="high"
      radius={32}
      saturation={180}
      scale={200}
      style={chipStyle}
    >
      <p className={styles.text}>{children}</p>
    </LiquidGlass>
  );
}
