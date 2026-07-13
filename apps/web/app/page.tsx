import Image from "next/image";
import type { CSSProperties } from "react";

import { BottomCtaBanner } from "../components/BottomCtaBanner";
import { BusinessTypesSection } from "../components/BusinessTypesSection";
import { CardCarousel } from "../components/CardCarousel";
import { FaqSection } from "../components/FaqSection";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Icon } from "../components/Icon";
import { partnerLogos } from "../components/partner-logos";
import { ProcessSection } from "../components/ProcessSection";
import { ProofMetrics } from "../components/ProofMetrics";
import { ProofPartnerLogoBanner } from "../components/ProofPartnerLogoBanner";
import { SectionShell } from "../components/SectionShell";
import { VideoBanner } from "../components/VideoBanner";
import {
  homeFaqs,
  homeInsights,
  homePortfolios,
  homeProblemQuotes,
  homeProofMetrics,
  homeReviews,
  homeServiceScopeSteps,
} from "./content";
import styles from "./page.module.css";

const homeLeftPortfolios = homePortfolios.filter((_, index) => index % 2 === 0);
const homeRightPortfolios = homePortfolios.filter(
  (_, index) => index % 2 === 1,
);

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.headerLayer}>
        <Header />
      </div>
      <VideoBanner
        actions={[
          {
            icon: "edit-03",
            id: "outsource",
            title: "외주 문의하기",
            variant: "blue",
          },
          {
            icon: "message-typing",
            id: "quick",
            title: "간편 문의하기",
            variant: "yellow",
          },
        ]}
        description="과한 스펙도, 긴 일정도 없이. 핵심만 담아 빠르게 검증하는 MVP 개발 파트너."
        eyebrow="MVP / 홈페이지 / 어플리케이션"
        title={
          <>
            부담은 제로, 출시는 현실로
            <br />
            MVP·홈페이지 개발 파트너, 제로소싱
          </>
        }
      />

      <div className={styles.root}>
        <div className={styles.viewport}>
          <div className={styles.track}>
            {[false, true].map((ariaHidden) => (
              <div
                aria-hidden={ariaHidden || undefined}
                className={styles.logoGroup}
                key={ariaHidden ? "duplicate" : "primary"}
              >
                {partnerLogos.map((logo) => (
                  <div
                    className={styles.logoSlot}
                    key={logo.alt}
                    style={
                      {
                        "--partner-logo-width": `${logo.width}px`,
                      } as CSSProperties
                    }
                  >
                    <Image
                      alt={ariaHidden ? "" : logo.alt}
                      className={styles.logo}
                      height={logo.height}
                      src={logo.src}
                      width={logo.width}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionShell
        description={
          <>
            기술력이 아니라 &apos;문제와 고민을 듣지 않는 구조&apos;가
            문제입니다.
            <br />
            그래서 제로소싱은 견적부터 꺼내지 않습니다. 무엇을 만들고 싶은지,
            무엇이 진짜 고민인지부터 듣습니다.
          </>
        }
        label="먼저 듣습니다"
        order="01"
        title={
          <>
            외주 개발 실패,
            <br />늘 같은 곳에서 시작됩니다
          </>
        }
      >
        <div className={styles.listeningContent} data-node-id="291:54079">
          <div className={styles.cards}>
            {homeProblemQuotes.map((quote) => (
              <article className={styles.listeningCard} key={quote.join("|")}>
                <Icon
                  className={styles.quoteIcon}
                  height={8}
                  name="quote-left"
                  width={9}
                />
                <p className={styles.cardText}>
                  {quote.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </article>
            ))}
          </div>
          <div className={styles.listeningSummary}>
            <p className={styles.listeningSummaryLine}>
              <span>그래서 우리는 &apos;무엇을 더할지&apos;보다</span>
              <span>
                <strong>&apos;무엇을 빼도 되는지&apos;</strong>부터 함께 정하고,
              </span>
            </p>
            <p>출시 후에도 끝까지 곁에 남습니다.</p>
          </div>
        </div>
      </SectionShell>

      <BusinessTypesSection />

      <SectionShell
        description={
          <>
            싸게 만들어서가 아닙니다. 시작 전 견적을 투명하게 열고, 덜어주고,
            빨리 내고, 끝까지 남기
            <br />
            때문입니다. 그 차이를 숫자와 고객님의 말로 보여드립니다.
          </>
        }
        label="왜 제로소싱일까요"
        order="03"
        title="왜 47.2%가 다시 찾을까요?"
      >
        <div className={styles.proofContent} data-node-id="138:4549">
          <div className={styles.proofBody}>
            <ProofMetrics items={homeProofMetrics} />
            <CardCarousel bleed={20} snapAlign="center">
              {homeReviews.map((review) => (
                <article className={styles.reviewCard} key={review.name}>
                  <div className={styles.reviewBody}>
                    <p className={styles.stars}>★★★★★</p>
                    <p className={styles.quote}>
                      {review.quote.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </p>
                  </div>
                  <div className={styles.reviewer}>
                    <p className={styles.reviewerName}>{review.name}</p>
                    <p className={styles.reviewerMeta}>
                      {review.company} · MVP 개발
                    </p>
                  </div>
                </article>
              ))}
            </CardCarousel>
          </div>
          <ProofPartnerLogoBanner />
        </div>
      </SectionShell>

      <SectionShell
        className={styles.scopeSection}
        description={
          <>
            <span className={styles.desktopDescriptionLine}>
              만드는 것에서 끝나지 않습니다. 세상에 띄우고, 지키고, 끝까지
              돌보는 일까지.
            </span>
            <br className={styles.desktopLineBreak} />
            <span className={styles.mobileDescriptionLine}>
              만드는 것에서 끝나지 않습니다.
            </span>
            <span className={styles.mobileDescriptionLine}>
              세상에 띄우고, 지키고, 끝까지 돌보는 일까지.
            </span>
            고객님이 신경 쓸 일을 하나씩 덜어냅니다.
          </>
        }
        label="어디까지 해주시나요"
        order="04"
        title={
          <>
            아이디어만 가져오세요
            <br />
            나머지는 전부 제로소싱이 담당합니다
          </>
        }
      >
        <div className={styles.scopeContent} data-node-id="138:4630">
          <div className={styles.stepList}>
            {homeServiceScopeSteps.map((step) => (
              <article className={styles.step} key={step.phase}>
                <div className={styles.phaseCard}>
                  <p className={styles.phase}>{step.phase}</p>
                  <div className={styles.phaseTitleGroup}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepSubtitle}>{step.subtitle}</p>
                  </div>
                </div>
                <div className={styles.detailCard}>
                  <p className={styles.scopeDescription}>
                    {step.description.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                  <ul className={styles.featureGrid}>
                    {step.items.map((item) => (
                      <li className={styles.featureItem} key={item}>
                        <span className={styles.featureIcon} aria-hidden="true">
                          <Icon name="check" size={10} />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.burdenBox}>
                    <span className={styles.burdenBadge}>덜어드리는 부담</span>
                    <p className={styles.burdenText}>{step.burden}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.scopeSummary}>
            <p>다섯 단계를 따로 맡기면 견적·소통·책임이 흩어집니다.</p>
            <p className={styles.scopeSummaryLine}>
              <span>제로소싱은 이 전부를</span>
              <span>
                <strong>한 팀이 책임지는 단일 창구</strong>입니다.
              </span>
            </p>
          </div>
        </div>
      </SectionShell>

      <ProcessSection />

      <section className={styles.portfolioSection} data-node-id="138:4957">
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.heading}>
              <div className={styles.kicker}>
                <span className={styles.orderChip}>
                  <span className={styles.orderText}>06</span>
                </span>
                <p className={styles.label}>포트폴리오</p>
              </div>
              <h2 className={styles.portfolioTitle}>
                말보다는 결과로 증명합니다
              </h2>
            </div>
            <p className={styles.portfolioDescription}>
              아이디어가 실제 제품이 된 순간들. 제로소싱이 함께한
              프로젝트입니다.
            </p>
          </div>

          <div className={styles.grid}>
            {[homeLeftPortfolios, homeRightPortfolios].map(
              (portfolios, columnIndex) => (
                <div
                  className={
                    columnIndex === 0
                      ? styles.column
                      : `${styles.column} ${styles.columnOffset}`
                  }
                  key={columnIndex === 0 ? "left" : "right"}
                >
                  {portfolios.map((portfolio) => (
                    <article
                      className={styles.portfolioCard}
                      key={portfolio.title}
                    >
                      <div
                        aria-hidden="true"
                        className={styles.portfolioThumbnail}
                      />
                      <div className={styles.cardContent}>
                        <div className={styles.portfolioCopy}>
                          <h3 className={styles.portfolioCardTitle}>
                            {portfolio.title}
                          </h3>
                          <p className={styles.cardDescription}>
                            {portfolio.description}
                          </p>
                        </div>
                        <p className={styles.duration}>
                          <Icon name="calendar-02" size={16} />
                          <span>{portfolio.duration}</span>
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <SectionShell
        description="맡기기 전 알아야 할 것들. 손해 보지 않고 빠르게 검증하는 외주 노하우를 나눕니다."
        label="진행 프로세스"
        order="07"
        title="MVP, 외주 개발을 더 잘하는 방법"
      >
        <div className={styles.insightContent} data-node-id="138:5026">
          <CardCarousel bleed={20} minItemWidth={330} snapAlign="center">
            {homeInsights.map((insight) => (
              <article className={styles.insightCard} key={insight.title}>
                <div aria-hidden="true" className={styles.insightThumbnail} />
                <div className={styles.insightCopy}>
                  <div className={styles.textGroup}>
                    <p className={styles.category}>{insight.category}</p>
                    <div className={styles.titleGroup}>
                      <h3 className={styles.insightCardTitle}>
                        {insight.title}
                      </h3>
                      <p className={styles.insightDescription}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  <p className={styles.date}>{insight.date}</p>
                </div>
              </article>
            ))}
          </CardCarousel>
        </div>
      </SectionShell>

      <FaqSection items={homeFaqs} />
      <BottomCtaBanner
        actions={[
          {
            icon: "edit-03",
            id: "outsource",
            title: "외주 문의하기",
            variant: "blue",
          },
          {
            icon: "message-typing",
            id: "quick",
            title: "간편 상담받기",
            variant: "yellow",
          },
        ]}
        description="가능성부터 함께 점검해 드릴게요. 상담은 무료입니다."
        eyebrow="MVP / 홈페이지 / 어플리케이션 개발 지금 시작하세요"
        title="아이디어, 부담 없이 이야기해보세요"
      />
      <Footer />
    </main>
  );
}
