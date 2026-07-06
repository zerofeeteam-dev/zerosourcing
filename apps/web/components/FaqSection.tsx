import type { ReactNode } from "react";

import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./FaqSection.module.css";

type FaqItem = {
  answer: string;
  question: string;
};

const faqs: readonly FaqItem[] = [
  {
    question: "MVP 개발 비용은 얼마나 드나요?",
    answer:
      "기능 범위와 연동 난이도에 따라 달라집니다. 상담에서 꼭 필요한 기능을 먼저 정리한 뒤, 불필요한 범위는 덜어내고 견적을 투명하게 안내드립니다.",
  },
  {
    question: "개발 기간은 보통 얼마나 걸리나요?",
    answer:
      "제로소싱의 MVP 개발 기간은 평균 4주 내외입니다. 풀스펙으로 6개월씩 끄는 대신, 검증에 꼭 필요한 핵심 기능만 담아 빠르게 출시합니다. 상담에서 기능 범위를 확정한 뒤 정확한 일정을 약속드리고, 진행 중 변동이 생기면 즉시 공유합니다.",
  },
  {
    question: "외주 개발 견적이 업체마다 천차만별인 이유는 뭔가요?",
    answer:
      "기획 범위, 포함 기능, 디자인 완성도, 서버·결제·운영 범위가 업체마다 다르게 계산되기 때문입니다. 제로소싱은 견적 기준이 되는 요구사항부터 먼저 정리합니다.",
  },
  {
    question: "기획이 없어도 MVP 개발을 의뢰할 수 있나요?",
    answer:
      "가능합니다. 아이디어 단계라면 서비스 기획, 기능 우선순위, 사용자 흐름부터 함께 정리한 뒤 개발 범위를 확정합니다.",
  },
  {
    question: "소스코드와 결과물의 소유권은 모두 넘겨받나요?",
    answer:
      "계약 범위에 포함된 결과물과 소스코드는 납품 시 전달드립니다. 배포 계정, 도메인, 서버 등 운영에 필요한 항목도 고객님 명의 기준으로 정리합니다.",
  },
  {
    question: "MVP 출시 후 추가 개발과 유지보수도 가능한가요?",
    answer:
      "가능합니다. 직접 개발한 코드의 버그는 계속 대응하고, 출시 후 데이터와 고객 반응을 기준으로 다음 기능 개발도 이어갈 수 있습니다.",
  },
  {
    question: "노코드와 외주 개발, 어떤 게 우리 MVP에 맞을까요?",
    answer:
      "검증 속도가 가장 중요하고 기능이 단순하면 노코드가 맞을 수 있습니다. 결제, 권한, 데이터 구조, 확장성이 중요하다면 처음부터 개발로 가는 편이 안전합니다.",
  },
];

type FaqSectionProps = {
  items?: readonly FaqItem[];
  order?: string;
  title?: ReactNode;
};

export function FaqSection({
  items = faqs,
  order = "08",
  title = "MVP 개발 외주, 가장 많이 묻는 질문",
}: FaqSectionProps = {}) {
  return (
    <SectionShell
      label="자주 묻는 질문"
      order={order}
      title={title}
    >
      <div className={styles.list}>
        {items.map((faq, index) => (
          <div className={styles.row} key={faq.question}>
            <details className={styles.item}>
              <summary className={styles.summary}>
                <span className={styles.question}>Q. {faq.question}</span>
                <Icon className={styles.chevron} name="chevron-down" size={20} />
              </summary>
              <p className={styles.answer}>A. {faq.answer}</p>
            </details>
            {index < items.length - 1 ? (
              <span aria-hidden="true" className={styles.divider} />
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
