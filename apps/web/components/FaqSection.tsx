import type { ReactNode } from "react";

import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./FaqSection.module.css";

type FaqItem = {
  answer: string;
  question: string;
};

type FaqSectionProps = {
  items: readonly FaqItem[];
  order?: string;
  title?: ReactNode;
};

export function FaqSection({
  items,
  order = "08",
  title = "MVP 개발 외주, 가장 많이 묻는 질문",
}: FaqSectionProps) {
  return (
    <SectionShell label="자주 묻는 질문" order={order} title={title}>
      <div className={styles.list}>
        {items.map((faq, index) => (
          <div className={styles.row} key={faq.question}>
            <details className={styles.item}>
              <summary className={styles.summary}>
                <span className={styles.question}>Q. {faq.question}</span>
                <Icon
                  className={styles.chevron}
                  name="chevron-down"
                  size={20}
                />
              </summary>
              <p className={styles.answer}>{faq.answer}</p>
            </details>
            {index < items.length - 1 ? (
              <span aria-hidden="true" className={styles.divider} />
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
