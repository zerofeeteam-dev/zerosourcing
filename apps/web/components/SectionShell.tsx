import type { ReactNode } from "react";

import styles from "./SectionShell.module.css";

type SectionShellProps = {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  label: string;
  order: string;
  title: ReactNode;
};

export function SectionShell({
  children,
  className,
  description,
  label,
  order,
  title,
}: SectionShellProps) {
  return (
    <section
      className={className ? `${styles.section} ${className}` : styles.section}
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <div className={styles.kicker}>
              <span className={styles.orderChip}>
                <span className={styles.orderText}>{order}</span>
              </span>
              <p className={styles.label}>{label}</p>
            </div>
            <h2 className={styles.title}>{title}</h2>
          </div>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </section>
  );
}
