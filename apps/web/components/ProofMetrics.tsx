import { Fragment } from "react";

import styles from "./ProofMetrics.module.css";

type ProofMetric = {
  label: string;
  note: string;
  value: string;
};

type ProofMetricsProps = {
  items: ProofMetric[];
};

export function ProofMetrics({ items }: ProofMetricsProps) {
  return (
    <div className={styles.metrics}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? (
            <span className={styles.divider} aria-hidden="true" />
          ) : null}
          <div className={styles.metric}>
            <div className={styles.valueGroup}>
              <p className={styles.label}>{item.label}</p>
              <p className={styles.value}>{item.value}</p>
            </div>
            <p className={styles.note}>{item.note}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
