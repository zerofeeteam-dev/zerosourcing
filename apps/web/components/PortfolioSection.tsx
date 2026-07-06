import { Icon } from "./Icon";
import styles from "./PortfolioSection.module.css";

const portfolios = [
  {
    title: "클래스잇",
    description: "인터넷 강의 홈페이지 제작 SaaS",
    duration: "소요기간 3주",
  },
  {
    title: "[MVP] 믿잇 플러스",
    description: "시니어 행사 참여인원 모집 플랫폼",
    duration: "소요기간 3주",
  },
  {
    title: "[MVP] 투두몰",
    description: "초보 학습자를 위한 투두리스트 제공 플랫폼",
    duration: "소요기간 3주",
  },
  {
    title: "리팡",
    description: "해외 불법 상품 차단 데이터 CRM",
    duration: "소요기간 3주",
  },
  {
    title: "[MVP] 공:사 모락모락",
    description: "공기업·사회적기업 채용 및 리뷰 플랫폼",
    duration: "소요기간 3주",
  },
  {
    title: "장례담",
    description: "장례 견적 사전 조회 홈페이지",
    duration: "소요기간 3주",
  },
];
const leftPortfolios = portfolios.filter((_, index) => index % 2 === 0);
const rightPortfolios = portfolios.filter((_, index) => index % 2 === 1);

function PortfolioCard({ description, duration, title }: (typeof portfolios)[number]) {
  return (
    <article className={styles.card}>
      <div aria-hidden="true" className={styles.thumbnail} />
      <div className={styles.cardContent}>
        <div className={styles.copy}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardDescription}>{description}</p>
        </div>
        <p className={styles.duration}>
          <Icon name="calendar-02" size={16} />
          <span>{duration}</span>
        </p>
      </div>
    </article>
  );
}

export function PortfolioSection() {
  return (
    <section className={styles.section} data-node-id="138:4957">
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <div className={styles.kicker}>
              <span
                className={`${styles.orderChip} glassSurface glassSurfacePill glassSurfaceGradientBorder`}
              >
                <span className={styles.orderText}>06</span>
              </span>
              <p className={styles.label}>포트폴리오</p>
            </div>
            <h2 className={styles.title}>말보다는 결과로 증명합니다</h2>
          </div>
          <p className={styles.description}>
            아이디어가 실제 제품이 된 순간들. 제로소싱이 함께한 프로젝트입니다.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.column}>
            {leftPortfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.title} {...portfolio} />
            ))}
          </div>
          <div className={`${styles.column} ${styles.columnOffset}`}>
            {rightPortfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.title} {...portfolio} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
