import { CardCarousel } from "./CardCarousel";
import { ProofMetrics } from "./ProofMetrics";
import { SectionShell } from "./SectionShell";
import styles from "./ProofSection.module.css";

const metrics = [
  {
    label: "누적 프로젝트",
    value: "172건+",
    note: "2025년 9월 기준",
  },
  {
    label: "재의뢰율",
    value: "47.2%",
    note: "2025년 9월 기준",
  },
  {
    label: "평균 MVP 출시 기간",
    value: "4주",
    note: "기능 규모에 따라 변동",
  },
  {
    label: "품질 보증",
    value: "영구 보장",
    note: "추가 기능 개발 별도 협의",
  },
];

const reviews = [
  {
    quote: [
      '"지금까지 협업한 외주사 중 만족도가 가장 높았어요."',
      "런칭 일정에 맞춰 웹앱과 랜딩페이지를 체계적으로, 빨랐습니다.",
      "커뮤니케이션도 즉각적이고 정확했습니다.",
    ],
    name: "차민* 팀장님",
    company: "CJ제일제당 사내벤처팀",
  },
  {
    quote: [
      "아이디어만 있던 기획을 디자인과 개발까지",
      "완성도 높게 구현해주셨어요.",
      "도메인·플랜 같은 추가 문제까지 함께 풀어준 귀한 파트너였습니다.",
    ],
    name: "이은* 팀장님",
    company: "공적인사적모임(아산나눔재단)",
  },
  {
    quote: [
      "창업 멤버가 떠나 막막했는데,",
      "복잡한 기능을 기존 개발자보다 빠르게 한 달 만에 완성했어요.",
      "B2B 결제 같은 긴급 기능까지 처리해줘 대기업 제휴도 진행 중입니다.",
    ],
    name: "최현* 대표님",
    company: "마이플랜잇(예창패 우수기업)",
  },
];

export function ProofSection() {
  return (
    <SectionShell
      description={
        <>
          싸게 만들어서가 아닙니다. 시작 전 견적을 투명하게 열고, 덜어주고, 빨리
          내고, 끝까지 남기
          <br />
          때문입니다. 그 차이를 숫자와 고객님의 말로 보여드립니다.
        </>
      }
      label="왜 제로소싱일까요"
      order="03"
      title="왜 47.2%가 다시 찾을까요?"
    >
      <div className={styles.content} data-node-id="138:4549">
        <ProofMetrics items={metrics} />
        <CardCarousel bleed={20} snapAlign="center">
          {reviews.map((review) => (
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
    </SectionShell>
  );
}
