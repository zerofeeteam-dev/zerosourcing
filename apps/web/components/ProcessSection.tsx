"use client";

import type { CSSProperties } from "react";

import { Icon, type IconName } from "./Icon";
import { ProcessStepCard } from "./ProcessStepCard";
import { emitCtaClick } from "./cta-events";
import styles from "./ProcessSection.module.css";

const steps: Array<{
  description: string;
  duration: string;
  iconName: IconName;
  title: string;
}> = [
  {
    description: "대표님의 아이디어와 고민을 충분히 듣습니다.",
    duration: "~1일 소요",
    iconName: "headphones",
    title: "무료 상담",
  },
  {
    description: "말씀 주신 아이디어 중 뺄 것과 남길 것을 함께 정합니다.",
    duration: "3~5일 소요",
    iconName: "file-edit-02",
    title: "핵심 기능 정의",
  },
  {
    description: "기획부터 개발까지 한 팀이 원스톱으로 진행합니다.",
    duration: "2~3주 소요",
    iconName: "wrench",
    title: "빠른 개발",
  },
  {
    description: "도메인·서버·보안까지 세팅 완료된 프로덕트를 전달합니다.",
    duration: "~3일 소요",
    iconName: "component",
    title: "출시",
  },
  {
    description: "지속적으로 프로덕트 데이터를 보며 다음을 설계합니다.",
    duration: "영구 지속",
    iconName: "line-chart-up-02",
    title: "검증 & 확장",
  },
];

type ProcessSectionProps = {
  order?: string;
  paddingTop?: number;
};

type ProcessSectionStyle = CSSProperties & {
  "--process-section-padding-top"?: string;
};

export function ProcessSection({
  order = "05",
  paddingTop,
}: ProcessSectionProps) {
  const style: ProcessSectionStyle | undefined =
    paddingTop === undefined
      ? undefined
      : { "--process-section-padding-top": `${paddingTop}px` };

  return (
    <section className={styles.section} data-node-id="291:54485" style={style}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <div className={styles.kicker}>
              <span className={styles.orderChip}>
                <span className={styles.orderText}>{order}</span>
              </span>
              <p className={styles.label}>진행 프로세스</p>
            </div>
            <h2 className={styles.title}>제로에서 현실까지, 5단계</h2>
          </div>
          <div className={styles.description}>
            <p className={styles.descriptionMain}>
              &apos;빠르다&apos;는 약속을, 눈에 보이는 단계로 증명합니다.
            </p>
            <p className={styles.descriptionNote}>
              ※ MVP 개발 기준으로 산정된 일정입니다. 자세한 일정은 아래 버튼을
              통해 문의해주시면 감사하겠습니다.
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.rail}>
            {steps.map((step, index) => (
              <div className={styles.stepSlot} key={step.title}>
                <ProcessStepCard {...step} />
                {index < steps.length - 1 ? (
                  <Icon
                    className={styles.arrow}
                    name="chevron-right"
                    size={24}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <p className={styles.ctaText}>
              자세한 일정 및 견적 상담이 필요하신가요?
            </p>
            <button
              className={styles.textButton}
              onClick={() => emitCtaClick("quick")}
              type="button"
            >
              <span>카카오톡 1:1 상담</span>
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
