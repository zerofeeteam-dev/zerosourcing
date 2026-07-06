import { InfoCard } from "./InfoCard";
import { SectionShell } from "./SectionShell";
import styles from "./MvpIntroSection.module.css";

const cards = [
  {
    eyebrow: "MISUNDERSTOOD",
    title: "흔한 오해",
    description: [
      "MVP는 대충 만든 반쪽짜리가 아닙니다. 기능이 적을 뿐,",
      "핵심은 제대로 작동해야 사용자에게 물어볼 수 있습니다.",
    ],
  },
  {
    eyebrow: "WHAT IT IS",
    title: "제대로 된 MVP",
    description: [
      "가장 중요한 가설 하나를, 가장 빠르게 검증하는 제품.",
      '"이게 팔릴까?"에 시장이 직접 답하게 만드는 도구입니다.',
    ],
  },
];

export function MvpIntroSection() {
  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          MVP(Minimum Viable Product)는 &apos;최소 기능 제품&apos;입니다.
          <br />
          모든 걸 다 만드는 게 아니라, 시장에 던질 가설을 검증할
          최소한만 빠르게 만드는 것이 핵심입니다.
        </>
      }
      label="MVP란 무엇인가"
      order="01"
      title={
        <>
          완성품을 싸게가 아니라,
          <br />
          핵심만 제대로
        </>
      }
    >
      <div className={styles.cards} data-node-id="291:55423">
        {cards.map((card) => (
          <InfoCard key={card.eyebrow} {...card} />
        ))}
      </div>
    </SectionShell>
  );
}
