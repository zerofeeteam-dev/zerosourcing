"use client";

import { useState } from "react";
import Link from "next/link";

import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { Icon } from "../../components/Icon";
import pageStyles from "../page.module.css";
import {
  categories,
  type Category,
  featuredCase,
  metrics,
  portfolioItems,
} from "./portfolio-items";
import styles from "./page.module.css";

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체");
  const filteredItems =
    selectedCategory === "전체"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === selectedCategory);

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
              아이디어가 제품이 된 순간들. MVP부터 어플리케이션, 기업
              홈페이지까지 제로소싱이 만든 제작 사례를 모았습니다.
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

          <article className={styles.featured} data-node-id="74:3527">
            <div className={styles.featuredPreview}>
              <div className={styles.thumbnail}>
                <span className={styles.logoPill}>zeroSourcing</span>
              </div>
            </div>
            <div className={styles.featuredBody}>
              <div className={styles.featuredCategory}>
                <Icon name="package-02" size={20} />
                <p>{featuredCase.category}</p>
              </div>
              <div className={styles.featuredContent}>
                <div className={styles.featuredTitleGroup}>
                  <h2 className={styles.featuredTitle}>{featuredCase.title}</h2>
                  <p className={styles.featuredDescription}>
                    {featuredCase.description}
                  </p>
                </div>
                <span className={styles.featuredDivider} aria-hidden="true" />
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <p className={styles.summaryLabel}>견적</p>
                    <p className={styles.summaryValue}>{featuredCase.estimate}</p>
                  </div>
                  <div className={styles.summaryItem}>
                    <p className={styles.summaryLabel}>개발 기간</p>
                    <p className={styles.summaryValue}>{featuredCase.period}</p>
                  </div>
                </div>
                <div className={styles.detailGroup}>
                  <p className={styles.summaryLabel}>핵심 기능</p>
                  <div className={styles.tagList}>
                    {featuredCase.features.map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.detailGroup}>
                  <p className={styles.summaryLabel}>작업 범위</p>
                  <div className={styles.tagList}>
                    {featuredCase.scope.map((scope) => (
                      <span key={scope}>{scope}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>

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

            <div className={styles.grid}>
              {filteredItems.map((item) => (
                <PortfolioCard item={item} key={item.title} />
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function PortfolioCard({ item }: { item: (typeof portfolioItems)[number] }) {
  const content = (
    <>
      <div className={styles.cardThumbnail} aria-hidden="true" />
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
    </>
  );

  if ("slug" in item) {
    return (
      <Link className={styles.card} href={`/portfolio/${item.slug}`}>
        {content}
      </Link>
    );
  }

  return <article className={styles.card}>{content}</article>;
}
