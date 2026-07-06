import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./ListeningSection.module.css";

const problemQuotes = [
  [
    "가장 싼 견적에 끌려 맡겼는데,",
    '"예상보다 복잡하다"며 추가 비용만',
    "계속 늘었어요.",
  ],
  [
    "한 달 내내 진행되는 '척'만 하더니,",
    "마감일에 받은 홈페이지에서는",
    "제대로 동작하는 게 없었죠.",
  ],
  [
    "풀스펙 30개 기능을 제안받아",
    "6개월에 수천만 원.",
    "정작 검증하고 싶던 핵심은 못 봤어요.",
  ],
  [
    "납품 끝나니 담당자가 사라졌어요.",
    "발견된 버그 하나를 고치려고",
    "새 업체를 찾는 것부터 다시 해야 했어요.",
  ],
];

export function ListeningSection() {
  return (
    <SectionShell
      description={
        <>
          기술력이 아니라 &apos;문제와 고민을 듣지 않는 구조&apos;가 문제입니다.
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
      <div className={styles.content} data-node-id="291:54079">
        <div className={styles.cards}>
          {problemQuotes.map((quote) => (
            <article className={styles.card} key={quote.join("|")}>
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
        <div className={styles.summary}>
          <p className={styles.summaryLine}>
            <span>그래서 우리는 &apos;무엇을 더할지&apos;보다</span>
            <span>
              <strong>&apos;무엇을 빼도 되는지&apos;</strong>부터 함께 정하고,
            </span>
          </p>
          <p>출시 후에도 끝까지 곁에 남습니다.</p>
        </div>
      </div>
    </SectionShell>
  );
}
