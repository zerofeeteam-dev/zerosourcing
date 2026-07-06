import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./AppBuildFlowSection.module.css";

type Step = {
  description: string;
  eyebrow: string;
  title: string;
  variant?: "brand";
};

const steps: [Step, Step, Step, Step] = [
  {
    description: "화면·기능을 웹으로 한 번만(반응형 개발)",
    eyebrow: "SOURCE",
    title: "웹 코드 한 벌",
  },
  {
    description: "네이티브로 감싸 앱 빌드",
    eyebrow: "PACKAGING",
    title: "RN 패키징",
    variant: "brand",
  },
  {
    description: "앱스토어 앱 심사 대행까지",
    eyebrow: "APP STORE",
    title: "iOS 앱",
  },
  {
    description: "플레이스토어 앱 심사 대행까지",
    eyebrow: "GOOGLE PLAY",
    title: "안드로이드 앱",
  },
] as const;

function StepCard({
  description,
  eyebrow,
  title,
  variant,
}: (typeof steps)[number]) {
  const cardClassName =
    variant === "brand"
      ? `${styles.card} ${styles.brandCard}`
      : styles.card;

  return (
    <article className={cardClassName}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <div className={styles.copy}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
    </article>
  );
}

export function AppBuildFlowSection() {
  const [source, packaging, appStore, googlePlay] = steps;

  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          제로소싱의 앱은 웹 기술로 화면을 만들고, 이를 React Native로
          패키징해 출시하는 &apos;웹뷰 하이브리드&apos; 방식입니다.
          <br />
          하나의 코드로 iOS와 안드로이드를 모두 만들어, 두 배의 일을 한 번으로
          줄입니다.
        </>
      }
      label="어떻게 만드나요"
      order="01"
      title={
        <>
          한 벌의 코드가,
          <br />두 개의 앱이 됩니다
        </>
      }
    >
      <div className={styles.flow} data-node-id="43:3305">
        <StepCard {...source} />
        <Icon
          aria-hidden="true"
          className={styles.arrow}
          name="chevron-right"
          size={24}
        />
        <StepCard {...packaging} />
        <Icon
          aria-hidden="true"
          className={styles.arrow}
          name="chevron-right"
          size={24}
        />
        <div className={styles.storeStack}>
          <StepCard {...appStore} />
          <StepCard {...googlePlay} />
        </div>
      </div>
    </SectionShell>
  );
}
