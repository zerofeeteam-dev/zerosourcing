import type { Metadata } from "next";
import type { ReactNode } from "react";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Liquid Glass",
  robots: {
    index: false,
    follow: false,
  },
};

function LiquidGlassPill({
  children,
  className,
  labelClassName,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly labelClassName?: string;
}) {
  return (
    <span className={className ? `${styles.pill} ${className}` : styles.pill}>
      <span aria-hidden className={styles.pillShine} />
      <span className={labelClassName ?? styles.pillLabel}>{children}</span>
    </span>
  );
}

export default function LiquidGlassPage() {
  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Liquid Glass</h1>
        <p className={styles.lead}>
          backdrop blur + inset highlight + soft volume. 레퍼런스 pill을 CSS로
          재현한 프리뷰입니다.
        </p>
      </div>

      <section aria-label="Colorful backdrop preview" className={styles.stage}>
        <div aria-hidden className={styles.stagePattern} />
        <div aria-hidden className={`${styles.stageBlob} ${styles.stageBlobA}`} />
        <div aria-hidden className={`${styles.stageBlob} ${styles.stageBlobB}`} />
        <div aria-hidden className={`${styles.stageBlob} ${styles.stageBlobC}`} />
        <LiquidGlassPill>MVP 개발</LiquidGlassPill>
      </section>

      <section aria-label="White surface reference" className={styles.panel}>
        <p className={styles.panelLabel}>화이트 배경 (레퍼런스에 가깝게)</p>
        <LiquidGlassPill>MVP 개발</LiquidGlassPill>
        <div className={styles.row}>
          <LiquidGlassPill
            className={styles.pillSm}
            labelClassName={styles.pillSmLabel}
          >
            MVP
          </LiquidGlassPill>
          <LiquidGlassPill>하이브리드 앱</LiquidGlassPill>
          <LiquidGlassPill
            className={styles.pillLg}
            labelClassName={styles.pillLgLabel}
          >
            기업 홈페이지
          </LiquidGlassPill>
        </div>
      </section>
    </main>
  );
}
