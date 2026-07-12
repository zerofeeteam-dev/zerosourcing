import type { ReactNode } from "react";

import { CardCarousel } from "./CardCarousel";
import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./ServicePortfolioSection.module.css";

const portfolios = [
  {
    description: "시니어 행사 참여인원 모집 플랫폼",
    duration: "소요기간 3주",
    title: "[MVP] 믿잇 플러스",
  },
  {
    description: "초보 학습자를 위한 투두리스트 제공 플랫폼",
    duration: "소요기간 3주",
    title: "[MVP] 투두몰",
  },
  {
    description: "공기업·사회적기업 채용 및 리뷰 플랫폼",
    duration: "소요기간 3주",
    title: "[MVP] 공:사 모락모락",
  },
];

type ServicePortfolioSectionProps = {
  contentNodeId: string;
  description?: ReactNode;
  label: string;
  order: string;
  title: ReactNode;
};

export function ServicePortfolioSection({
  contentNodeId,
  description,
  label,
  order,
  title,
}: ServicePortfolioSectionProps) {
  return (
    <SectionShell
      className={styles.section}
      description={description}
      label={label}
      order={order}
      title={title}
    >
      <div className={styles.content} data-node-id={contentNodeId}>
        <CardCarousel bleed={20} minItemWidth={330} snapAlign="center">
          {portfolios.map((portfolio) => (
            <article className={styles.card} key={portfolio.title}>
              <div aria-hidden="true" className={styles.thumbnail} />
              <div className={styles.copy}>
                <div className={styles.textGroup}>
                  <h3 className={styles.cardTitle}>{portfolio.title}</h3>
                  <p className={styles.description}>{portfolio.description}</p>
                </div>
                <p className={styles.duration}>
                  <Icon name="calendar-02" size={16} />
                  <span>{portfolio.duration}</span>
                </p>
              </div>
            </article>
          ))}
        </CardCarousel>
      </div>
    </SectionShell>
  );
}
