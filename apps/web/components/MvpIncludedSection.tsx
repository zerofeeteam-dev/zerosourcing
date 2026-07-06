import { InfoCard } from "./InfoCard";
import { SectionShell } from "./SectionShell";
import styles from "./MvpIncludedSection.module.css";

const cards = [
  {
    eyebrow: "STEP 01",
    title: "기획",
    description: ["핵심 기능 정의 · 화면 설계"],
  },
  {
    eyebrow: "STEP 02",
    title: "디자인",
    description: ["핵심 화면 UX/UI"],
  },
  {
    eyebrow: "STEP 03",
    title: "개발",
    description: ["프론트 · 백엔드 · DB · 핵심 기능"],
  },
  {
    eyebrow: "STEP 04",
    title: "출시",
    description: ["도메인 · 서버 · 배포"],
  },
  {
    eyebrow: "STEP 05",
    title: "검증 · 보장",
    description: ["데이터 분석 세팅 · 버그 영구 보장"],
  },
];

export function MvpIncludedSection() {
  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          &apos;만들어 주는 것&apos;에서 끝나지 않습니다. 기획부터 영구
          보장까지, 다섯 단계가 한 번에 들어갑니다.
        </>
      }
      label="무엇이 포함되나요"
      order="03"
      title={
        <>
          MVP 하나에,
          <br />
          출시와 보장까지 한 묶음
        </>
      }
    >
      <div className={styles.cards} data-node-id="30:1108">
        {cards.map((card) => (
          <InfoCard className={styles.card} key={card.eyebrow} {...card} />
        ))}
      </div>
    </SectionShell>
  );
}
