import type { ReactNode } from "react";

import type { FaqItem } from "../content/faqs";
import { FaqHashTarget } from "./FaqHashTarget";
import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./FaqSection.module.css";

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
      <FaqHashTarget />
      <div className={styles.list}>
        {items.map((faq, index) => (
          <div className={styles.row} key={faq.id}>
            <details className={styles.item} id={faq.id}>
              <summary className={styles.summary}>
                <h3 className={styles.question}>Q. {faq.question}</h3>
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
