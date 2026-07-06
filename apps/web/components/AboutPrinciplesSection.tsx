import { SectionShell } from "./SectionShell";
import styles from "./AboutPrinciplesSection.module.css";

const principles = [
  {
    id: "01",
    title: "덜어내는 것이 먼저다.",
    description: "더 많은 기능이 아니라, 빼도 되는 기능을 먼저 찾습니다. 검증에 필요한 핵심만 남깁니다.",
  },
  {
    id: "02",
    title: "듣지 않으면 만들지 않는다.",
    description: "견적서보다 대화가 먼저입니다. 무엇이 진짜 고민인지부터 듣고 시작합니다.",
  },
  {
    id: "03",
    title: "빠른 게 곧 검증이다.",
    description: "완벽하지 못할 6개월보다, 시장에서 답을 듣는 4주. 빠르게 시작합니다.",
  },
  {
    id: "04",
    title: "도구가 아니라 결과로 말한다.",
    description: "특정 기술을 고집하지 않습니다. AI든 개발이든, 목적에 가장 맞는 방법을 고릅니다.",
  },
  {
    id: "05",
    title: "출시가 끝이 아니다.",
    description: "만든 사람이 끝까지 책임집니다. 직접 개발한 코드의 버그는 기간 제한 없이 보장합니다.",
  },
];

export function AboutPrinciplesSection() {
  return (
    <SectionShell
      className={styles.section}
      description="기술보다 먼저인 태도가 결과를 만든다고 믿습니다."
      label="일하는 방식"
      order="02"
      title="우리가 지키는 다섯 가지"
    >
      <div className={styles.timeline} data-node-id="20:1682">
        <span aria-hidden="true" className={styles.axis} />
        {principles.map((principle) => (
          <div className={styles.item} key={principle.id}>
            <div className={styles.marker}>
              <span className={styles.number}>{principle.id}</span>
              <span aria-hidden="true" className={styles.shape} />
            </div>
            <div className={styles.copy}>
              <p className={styles.itemTitle}>{principle.title}</p>
              <p className={styles.itemDescription}>{principle.description}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
