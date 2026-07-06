import { ProofMetrics } from "./ProofMetrics";
import { SectionShell } from "./SectionShell";
import styles from "./AboutHowSection.module.css";

const howItems = [
  {
    eyebrow: "HOW 01",
    title: "목적에 맞는 방법 선택",
    description:
      "빠른 시장 검증엔 가벼운 방식을, 독창적 로직과 자산화엔 정통 개발을. 하나의 도구에 갇히지 않고 가장 빠른 길을 택합니다.",
  },
  {
    eyebrow: "HOW 02",
    title: "AI를 속도의 도구로",
    description:
      "설계·구현·테스트에 AI를 적극 활용해, 며칠 걸리던 일을 더 짧게 끝냅니다. 빠르게 만들고 즉시 검증하는 방식으로 일합니다.",
  },
  {
    eyebrow: "HOW 03",
    title: "품질은 사람이 책임진다",
    description:
      "속도를 높이는 건 AI지만, 검증과 마무리는 사람의 몫입니다. 그래서 빠르면서도 안심하고 맡길 수 있습니다.",
  },
];

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

export function AboutHowSection() {
  return (
    <SectionShell
      description="비결은 특별한 도구 하나가 아니라, 목적에 맞는 방법을 고르는 유연함입니다."
      label="왜 제로소싱일까요"
      order="03"
      title={
        <>
          어떻게 더 빠르고,
          <br />더 가벼울까요?
        </>
      }
    >
      <div className={styles.content} data-node-id="20:861">
        <div className={styles.cardGrid} data-node-id="20:896">
          {howItems.map((item) => (
            <article className={styles.card} key={item.eyebrow}>
              <p className={styles.eyebrow}>{item.eyebrow}</p>
              <div className={styles.copy}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDescription}>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
        <ProofMetrics items={metrics} />
      </div>
    </SectionShell>
  );
}
