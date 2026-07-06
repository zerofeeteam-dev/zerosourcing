import { CardCarousel } from "./CardCarousel";
import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./MvpPortfolioSection.module.css";

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

export function AppPortfolioSection() {
  return (
    <SectionShell
      className={styles.section}
      label="어플리케이션 포트폴리오"
      order="05"
      title="하이브리드 앱 개발 사례"
    >
      <div className={styles.content} data-node-id="43:3501">
        <CardCarousel bleed={20} minItemWidth={330} snapAlign="center">
          {portfolios.map((portfolio) => (
            <article className={styles.card} key={portfolio.title}>
              <div aria-hidden="true" className={styles.thumbnail} />
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
            </article>
          ))}
        </CardCarousel>
      </div>
    </SectionShell>
  );
}
