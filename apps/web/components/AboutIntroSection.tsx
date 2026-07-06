import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./AboutIntroSection.module.css";

export function AboutIntroSection() {
  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          <span className={styles.descriptionBlock}>
            좋은 아이디어가 개발자를 구하지 못해 멈추고, 합리적인 검증이 비싼
            견적과 긴 일정에 가로막히는 일을 자주 봅니다.
            <br />
            제로소싱은 그 사이의 거리를 줄이려고 만들어졌습니다.
          </span>
          <span className={styles.descriptionBlock}>
            아이디어가 있다면, 누구나 빠르게 세상에 내놓을 수 있어야 한다고
            믿습니다.
            <br />
            그래서 우리는 &apos;무엇을 더 넣을지&apos;가 아니라 &apos;무엇을
            빼도 되는지&apos;부터 함께 정하고, 검증에 꼭 필요한 핵심만 가장
            빠른 방법으로 만듭니다.
            <br />
            때로는 그 방법이 AI를 활용하는 것이기도 합니다.
          </span>
        </>
      }
      label="제로소싱의 시작"
      order="01"
      title={
        <>
          아이디어와 출시 사이,
          <br />그 거리를 좁힙니다
        </>
      }
    >
      <div className={styles.quote} data-node-id="20:788">
        <Icon
          className={styles.quoteIcon}
          height={8}
          name="quote-left"
          width={9}
        />
        <p className={styles.quoteText}>
          <span>아이디어와 현실 사이의 거리를,</span>
          <strong className={styles.highlight}>가장 짧게.</strong>
        </p>
        <Icon
          className={`${styles.quoteIcon} ${styles.quoteIconEnd}`}
          height={8}
          name="quote-left"
          width={9}
        />
      </div>
    </SectionShell>
  );
}
