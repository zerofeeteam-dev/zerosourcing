import type { ReactNode } from "react";

import styles from "./SectionShell.module.css";

type SectionShellProps = {
  children: ReactNode;
  description: ReactNode;
  label: string;
  order: string;
  title: ReactNode;
};

export function SectionShell({
  children,
  description,
  label,
  order,
  title,
}: SectionShellProps) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <div className={styles.kicker}>
              <span
                className={`${styles.orderChip} glassSurface glassSurfacePill glassSurfaceGradientBorder`}
              >
                <span className={styles.orderText}>{order}</span>
              </span>
              <p className={styles.label}>{label}</p>
            </div>
            <h2 className={styles.title}>{title}</h2>
          </div>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </section>
  );
}
