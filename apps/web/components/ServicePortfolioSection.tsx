import type { ReactNode } from "react";
import Link from "next/link";

import { getServicePortfolios } from "../lib/public-content/queries";
import type { PortfolioType } from "../lib/public-content/types";
import { CardCarousel } from "./CardCarousel";
import { Icon } from "./Icon";
import { ManagedThumbnail } from "./ManagedThumbnail";
import { SectionShell } from "./SectionShell";
import styles from "./ServicePortfolioSection.module.css";

type ServicePortfolioSectionProps = {
  readonly contentNodeId: string;
  readonly description?: ReactNode;
  readonly label: string;
  readonly order: string;
  readonly portfolioType: PortfolioType;
  readonly title: ReactNode;
};

export async function ServicePortfolioSection({
  contentNodeId,
  description,
  label,
  order,
  portfolioType,
  title,
}: ServicePortfolioSectionProps) {
  const portfolios = await getServicePortfolios(portfolioType);

  return (
    <SectionShell
      className={styles.section}
      description={description}
      label={label}
      order={order}
      title={title}
    >
      <div className={styles.content} data-node-id={contentNodeId}>
        {portfolios.length > 0 ? (
          <CardCarousel bleed={20} minItemWidth={330} snapAlign="center">
            {portfolios.map((portfolio) => (
              <Link
                aria-label={`${portfolio.title} 포트폴리오 보기`}
                className={styles.card}
                href={`/portfolio/${portfolio.slug}`}
                key={portfolio.slug}
              >
                <ManagedThumbnail
                  alt={portfolio.thumbnailAlt}
                  className={styles.thumbnail!}
                  sizes="(max-width: 480px) 330px, 346px"
                  url={portfolio.thumbnailUrl}
                />
                <div className={styles.copy}>
                  <div className={styles.textGroup}>
                    <h3 className={styles.cardTitle}>{portfolio.title}</h3>
                    <p className={styles.description}>
                      {portfolio.description}
                    </p>
                  </div>
                  <p className={styles.duration}>
                    <Icon name="calendar-02" size={16} />
                    <span>{portfolio.duration}</span>
                  </p>
                </div>
              </Link>
            ))}
          </CardCarousel>
        ) : (
          <p className={styles.emptyText}>등록된 포트폴리오가 없습니다.</p>
        )}
      </div>
    </SectionShell>
  );
}
