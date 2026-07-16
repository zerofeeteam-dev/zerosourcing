"use client";

import Link from "next/link";
import { useState } from "react";

import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { Icon } from "../../components/Icon";
import { ManagedThumbnail } from "../../components/ManagedThumbnail";
import type { PortfolioCard as PortfolioCardModel } from "../../lib/public-content/types";
import pageStyles from "../page.module.css";
import styles from "./page.module.css";

const metrics = [
  { label: "누적 프로젝트", value: "172건+", note: "2025년 9월 기준" },
  { label: "재의뢰율", value: "47.2%", note: "2025년 9월 기준" },
  { label: "평균 MVP 출시 기간", value: "4주", note: "기능 규모에 따라 변동" },
] as const;

const categories = ["전체", "MVP", "어플리케이션", "기업 홈페이지"] as const;
type Category = (typeof categories)[number];

type PortfolioListClientProps = {
  readonly featured: PortfolioCardModel | null;
  readonly items: readonly PortfolioCardModel[];
};

export function PortfolioListClient({
  featured,
  items,
}: PortfolioListClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체");
  const filteredItems =
    selectedCategory === "전체"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <main className={pageStyles.page}>
      <div className={pageStyles.headerLayer}>
        <Header />
      </div>

      <section className={styles.section} data-node-id="69:2361">
        <div className={styles.inner}>
          <div className={styles.intro}>
            <div className={styles.heading}>
              <div className={styles.kicker}>
                <span className={styles.kickerChip}>Portfolio</span>
                <p className={styles.kickerLabel}>제로소싱 포트폴리오</p>
              </div>
              <h1 className={styles.title}>빠르게 검증하고, 현실이 된 것들</h1>
            </div>
            <p className={styles.description}>
              아이디어가 제품이 된 순간들. MVP부터 어플리케이션, 기업 홈페이지
              제로소싱이 만든 제작 사례를 모았습니다.
            </p>
          </div>

          <div className={styles.metrics} aria-label="포트폴리오 주요 지표">
            {metrics.map((metric, index) => (
              <div className={styles.metricGroup} key={metric.label}>
                {index > 0 ? (
                  <span className={styles.metricDivider} aria-hidden="true" />
                ) : null}
                <div className={styles.metric}>
                  <div className={styles.metricValueGroup}>
                    <p className={styles.metricLabel}>{metric.label}</p>
                    <p className={styles.metricValue}>{metric.value}</p>
                  </div>
                  <p className={styles.metricNote}>{metric.note}</p>
                </div>
              </div>
            ))}
          </div>

          {featured ? (
            <Link
              aria-label={`${featured.title} 포트폴리오 보기`}
              className={`${styles.featured} ${styles.clickableCard}`}
              data-node-id="74:3527"
              href={`/portfolio/${featured.slug}`}
            >
              <div className={styles.featuredPreview}>
                <ManagedThumbnail
                  alt=""
                  className={styles.thumbnail!}
                  loading="eager"
                  sizes="(max-width: 1023px) calc(100vw - 40px), 520px"
                  url={featured.thumbnailUrl}
                />
                <span className={styles.logoPill}>zeroSourcing</span>
              </div>
              <div className={styles.featuredBody}>
                <div className={styles.featuredCategory}>
                  <Icon name="package-02" size={20} />
                  <p>{featured.category}</p>
                </div>
                <div className={styles.featuredContent}>
                  <div className={styles.featuredTitleGroup}>
                    <h2 className={styles.featuredTitle}>{featured.title}</h2>
                    <p className={styles.featuredDescription}>
                      {featured.description}
                    </p>
                  </div>
                  <span className={styles.featuredDivider} aria-hidden="true" />
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <p className={styles.summaryLabel}>견적</p>
                      <p className={styles.summaryValue}>{featured.estimate}</p>
                    </div>
                    <div className={styles.summaryItem}>
                      <p className={styles.summaryLabel}>개발 기간</p>
                      <p className={styles.summaryValue}>{featured.duration}</p>
                    </div>
                  </div>
                  <div className={styles.detailGroup}>
                    <p className={styles.summaryLabel}>핵심 기능</p>
                    <div className={styles.tagList}>
                      {featured.features.map((feature) => (
                        <span key={feature}>{feature}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.detailGroup}>
                    <p className={styles.summaryLabel}>작업 범위</p>
                    <div className={styles.tagList}>
                      {featured.scope.map((scope) => (
                        <span key={scope}>{scope}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : null}

          <section className={styles.listSection} aria-label="포트폴리오 목록">
            <div className={styles.filterBar}>
              {categories.map((category) => (
                <button
                  aria-pressed={selectedCategory === category}
                  className={
                    selectedCategory === category
                      ? styles.activeFilter
                      : styles.filter
                  }
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>

            {featured ? (
              <div className={styles.grid}>
                {filteredItems.map((item) => (
                  <PortfolioCard item={item} key={item.slug} />
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>등록된 포트폴리오가 없습니다.</p>
            )}
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function PortfolioCard({ item }: { readonly item: PortfolioCardModel }) {
  return (
    <Link
      aria-label={`${item.title} 포트폴리오 보기`}
      className={`${styles.card} ${styles.clickableCard}`}
      href={`/portfolio/${item.slug}`}
    >
      <ManagedThumbnail
        alt=""
        className={styles.cardThumbnail!}
        sizes="(max-width: 480px) calc(100vw - 40px), (max-width: 1023px) 50vw, 346px"
        url={item.thumbnailUrl}
      />
      <div className={styles.cardContent}>
        <div className={styles.cardCopy}>
          <h2 className={styles.cardTitle}>{item.title}</h2>
          <p className={styles.cardDescription}>{item.description}</p>
        </div>
        <p className={styles.duration}>
          <Icon name="calendar-02" size={16} />
          <span>{item.duration}</span>
        </p>
      </div>
    </Link>
  );
}
