import { CardCarousel } from "./CardCarousel";
import { SectionShell } from "./SectionShell";
import styles from "./InsightSection.module.css";

const insights = [
  {
    category: "인사이트",
    date: "2026. 11. 02",
    description:
      "박람회·전시회에 참가하기 전, 브로슈어 제작에서 실패하지 않으려면 이것만은 꼭 확인하세요.",
    title: "기능을 빼야 더 빨리 검증되는 이유",
  },
  {
    category: "프로젝트 리뷰",
    date: "2026. 11. 02",
    description:
      "유광, 무광, 소프트 터치 코팅. 인쇄물의 완성도를 결정짓는 코팅 선택 가이드입니다.",
    title: "초기 스타트업을 위한 현실적인 앱 출시 전략",
  },
  {
    category: "인사이트",
    date: "2026. 11. 02",
    description:
      "디자인 발주 경험이 없는 담당자를 위해 씨브레인이 정리한 실수 방지 가이드입니다.",
    title: "GEO 설정, 이제 안 하면 검색에서 사라집니다",
  },
];

export function InsightSection() {
  return (
    <SectionShell
      description="맡기기 전 알아야 할 것들. 손해 보지 않고 빠르게 검증하는 외주 노하우를 나눕니다."
      label="진행 프로세스"
      order="07"
      title="MVP, 외주 개발을 더 잘하는 방법"
    >
      <div className={styles.content} data-node-id="138:5026">
        <CardCarousel bleed={20} minItemWidth={330} snapAlign="center">
          {insights.map((insight) => (
            <article className={styles.card} key={insight.title}>
              <div aria-hidden="true" className={styles.thumbnail} />
              <div className={styles.copy}>
                <div className={styles.textGroup}>
                  <p className={styles.category}>{insight.category}</p>
                  <div className={styles.titleGroup}>
                    <h3 className={styles.cardTitle}>{insight.title}</h3>
                    <p className={styles.description}>
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
  );
}
