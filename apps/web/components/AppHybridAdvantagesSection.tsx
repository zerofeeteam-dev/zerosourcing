import { Icon, type IconName } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./AppHybridAdvantagesSection.module.css";

const advantages: {
  description: string;
  icon: IconName;
  title: string;
}[] = [
  {
    description:
      "iOS용, 안드로이드용을 따로 개발하면 인력도 코드도 두 벌이 필요합니다. 하이브리드는 하나의 코드에서 두 OS 앱을 함께 빌드하기 때문에, 같은 앱이라도 네이티브 외주 대비 비용과 일정을 절반에 가깝게 줄입니다.",
    icon: "component",
    title: "한 번 개발, 두 OS",
  },
  {
    description:
      "네이티브 앱은 작은 문구 하나를 고쳐도 스토어 심사를 다시 받아야 해, 반영까지 며칠이 걸리기도 합니다. 하이브리드는 웹 기반이라 콘텐츠·기능 수정의 상당 부분이 스토어 재심사 없이 즉시 반영됩니다. 빠르게 고치고 빠르게 검증할 수 있습니다.",
    icon: "arrow-refresh-04",
    title: "빠른 업데이트",
  },
  {
    description:
      '"웹사이트를 앱처럼 보이게 한 것 아니냐"는 오해를 자주 받지만, 다릅니다. React Native로 패키징하기 때문에 푸시 알림, 결제, 카메라, 위치, 생체 인증 같은 기능을 그대로 씁니다. 사용자는 하이브리드인지 알아채지 못합니다.',
    icon: "code-02",
    title: "네이티브 기능",
  },
  {
    description:
      "두 번 만들지 않고, 두 번 고치지 않습니다. 그만큼 출시까지의 시간과 비용이 줄어, 초기 자금이 빠듯한 스타트업도 부담 없이 시작할 수 있습니다. 아낀 자원은 검증과 다음 개선에 씁니다.",
    icon: "currency-coin-dollar",
    title: "비용·일정 절감",
  },
];

export function AppHybridAdvantagesSection() {
  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          &apos;웹사이트를 앱처럼 보이게&apos;가 아닙니다.
          <br />
          React Native로 패키징해 네이티브 기능까지 쓰는, 진짜 앱입니다.
        </>
      }
      label="왜 하이브리드인가"
      order="02"
      title={
        <>
          하이브리드 앱 개발의
          <br />
          4가지 장점
        </>
      }
    >
      <div className={styles.list} data-node-id="43:3344">
        {advantages.map((advantage) => (
          <article className={styles.card} key={advantage.title}>
            <span aria-hidden="true" className={styles.iconBox}>
              <Icon name={advantage.icon} size={24} />
            </span>
            <div className={styles.copy}>
              <h3 className={styles.cardTitle}>{advantage.title}</h3>
              <p className={styles.description}>{advantage.description}</p>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
