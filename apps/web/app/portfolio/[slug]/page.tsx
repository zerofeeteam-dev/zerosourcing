import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { Breadcrumb } from "../../../components/Breadcrumb";
import { JsonLd } from "../../../components/JsonLd";
import { ManagedContent } from "../../../components/ManagedContent";
import { ManagedThumbnail } from "../../../components/ManagedThumbnail";
import { getPublishedPortfolio } from "../../../lib/public-content/queries";
import { createBreadcrumbJsonLd } from "../../../lib/seo/structured-data";
import { createPageMetadata } from "../../site-metadata";
import pageStyles from "../../page.module.css";
import { QuickConsultCtaButton } from "../../../components/QuickConsultCtaButton";
import styles from "./portfolio-detail.module.css";

type PortfolioDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PortfolioDetailPageProps) {
  const { slug } = await params;
  const portfolio = await getPublishedPortfolio(slug);

  if (!portfolio) {
    return {};
  }

  return createPageMetadata({
    title: `제로소싱 | ${portfolio.title}`,
    description: portfolio.seoDescription || portfolio.description,
    path: `/portfolio/${portfolio.slug}`,
  });
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  const { slug } = await params;
  const portfolio = await getPublishedPortfolio(slug);

  if (!portfolio) {
    notFound();
  }

  const breadcrumbItems = [
    { name: "Index", path: "/" },
    { name: "Portfolio", path: "/portfolio" },
    {
      name: portfolio.title,
      path: `/portfolio/${portfolio.slug}`,
    },
  ] as const;
  const breadcrumbJsonLd = createBreadcrumbJsonLd(breadcrumbItems);

  return (
    <main className={pageStyles.page}>
      <JsonLd data={breadcrumbJsonLd} id="portfolio-breadcrumb-json-ld" />
      <div className={pageStyles.headerLayer}>
        <Header />
      </div>

      <section className={styles.section} data-node-id="74:4248">
        <div className={styles.inner}>
          <div className={styles.overview}>
            <header className={styles.hero}>
              <div className={styles.heading}>
                <div className={styles.kicker}>
                  <span className={styles.kickerChip}>포트폴리오</span>
                  <Breadcrumb items={breadcrumbItems} />
                </div>
                <h1 className={styles.title}>{portfolio.title}</h1>
              </div>
              <p className={styles.description}>{portfolio.description}</p>
            </header>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                  <p className={styles.summaryLabel}>견적</p>
                  <p className={styles.summaryValue}>{portfolio.estimate}</p>
                </div>
                <div className={styles.summaryItem}>
                  <p className={styles.summaryLabel}>개발 기간</p>
                  <p className={styles.summaryValue}>{portfolio.duration}</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.detailItem}>
                  <p className={styles.summaryLabel}>핵심 기능</p>
                  <div className={styles.tagList}>
                    {portfolio.features.map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.summaryLabel}>작업 범위</p>
                  <div className={styles.tagList}>
                    {portfolio.scope.map((scope) => (
                      <span key={scope}>{scope}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ManagedThumbnail
            alt={portfolio.bannerAlt}
            className={styles.bannerFrame!}
            loading="eager"
            sizes="(max-width: 1120px) calc(100vw - 40px), 1080px"
            url={portfolio.bannerUrl}
          />

          <div className={styles.managedContent}>
            <ManagedContent
              assetBaseEnabled={portfolio.assetBaseEnabled}
              assetScope={portfolio.assetScope}
              authoringMode={portfolio.contentAuthoringMode}
              content={portfolio.content}
              entity="portfolio"
              outputMode={portfolio.contentMode}
              title={portfolio.title}
            />
          </div>

          <section className={styles.ctaBanner}>
            <div className={styles.ctaCopy}>
              <h2 className={styles.ctaTitle}>
                부담은 제로, 출시는 현실로
                <br />
                MVP·홈페이지 개발 파트너, 제로소싱
              </h2>
              <p className={styles.ctaDescription}>
                과한 스펙도, 긴 일정도 없이. 핵심만 담아 빠르게 검증하는 MVP
                개발 파트너.
              </p>
            </div>
            <QuickConsultCtaButton />
          </section>

          <Link className={styles.backLink} href="/portfolio">
            목록으로
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
