import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./ServiceScopeSection.module.css";

const steps = [
  {
    phase: "I. 설계",
    title: "서비스 기획",
    subtitle: "Planning",
    description: [
      "막연한 아이디어를 '개발할 수 있는 문서'로 바꾸는 단계입니다.",
      "외주 실패의 가장 큰 원인이 모호한 요구사항인 만큼, 여기서부터 함께 정리해 인식 차이를 없앱니다.",
    ],
    items: [
      "요구사항 정의서 작성 (견적·일정의 기준)",
      "아이디어 구체화 미팅 & 시장·경쟁 서비스 리서치",
      "기능 우선순위 정리 (필수 / 선택 구분)",
      "사용자 플로우 & 화면 설계(와이어프레임)",
    ],
    burden:
      '"어디서부터 정리해야 하지?" 하는 막막함. 기획 문서가 없어 나중에 "이건 계약에 없다"는 분쟁이 생기는 일까지 미리 막아 드립니다.',
  },
  {
    phase: "II. 제작",
    title: "디자인 · 개발",
    subtitle: "Design & Development",
    description: [
      "정리된 기획을 실제로 '보이고 작동하는 제품'으로 만드는 단계입니다.",
      "한 팀이 디자인부터 개발·테스트까지 맡아, 책임 소재가 흐려지지 않습니다.",
    ],
    items: [
      "UX/UI 디자인 (반응형 · 디자인 시스템)",
      "프론트엔드 개발",
      "백엔드 · API · 데이터베이스 설계",
      "로그인 · 결제(PG) · 알림 등 핵심 기능 구현",
      "QA 테스트 & 버그 수정",
    ],
    burden:
      "'한 달차 신입에게 떠넘겨진' 결과물을 받을 걱정. 진행 상황을 정기적으로 공유해, 마감일에야 문제를 알게 되는 일이 없습니다.",
  },
  {
    phase: "III. 출시",
    title: "출시 · 인프라",
    subtitle: "Launch & Infra",
    description: [
      "완성한 제품을 실제 사용자가 쓸 수 있도록 '세상에 띄우는' 단계입니다.",
      "비개발자에게 가장 막막한 영역을 대신 세팅하고 운영합니다.",
    ],
    items: [
      "도메인 구매 & 연결",
      "클라우드 서버 구축 · 배포 (AWS 등)",
      "앱스토어 · 플레이스토어 심사/등록 대행",
      "트래픽 모니터링 & 장애 대응 체계",
      "백업 · 무중단 배포 환경 구성",
    ],
    burden:
      '"도메인은 어떻게 사지?", "서버가 터지면?" 하는 불안. 출시에 필요한 기술 인프라를 처음부터 끝까지 맡아 드립니다.',
  },
  {
    phase: "IV. 보호·노출",
    title: "보안 · SEO/GEO",
    subtitle: "Protect & Reach",
    description: [
      "만들고 띄운 제품을 '지키고, 발견되게' 하는 단계입니다.",
      '보안 사고와 "검색에 안 잡히는" 문제는 출시 후 가장 자주 놓치는 영역입니다.',
    ],
    items: [
      "정보 보안 (SSL · 데이터 암호화 · 접근 제어)",
      "개인정보 처리방침 등 기본 법적 요건 점검",
      "로딩 속도 · 모바일 성능 최적화",
      "SEO, 메타태그 · 구조화 데이터 · 사이트맵",
      "GEO, 생성형 AI 검색(ChatGPT·Perplexity) 노출 대응",
    ],
    burden:
      "해킹·정보 유출 걱정과, 애써 만든 서비스가 검색·AI 답변에 노출되지 않는 문제. 지키는 일과 발견되는 일을 동시에 챙깁니다.",
  },
  {
    phase: "V. 그 이후",
    title: "버그 유지보수",
    subtitle: "Software Maintenance",
    description: [
      "출시는 끝이 아니라 시작입니다.",
      "납품 후 담당자가 사라지는 외주가 아니라, 제품이 살아 움직이는 동안 곁에 남는 파트너가 됩니다.",
    ],
    items: [
      "직접 개발한 코드의 버그 무상 수정 (기간 제한 없음)",
      "iOS · 안드로이드 · 브라우저 업데이트 대응",
      "출시 후 데이터 기반 개선 제안",
      "추가 기능 개발 (별도 협의로 연속 지원)",
    ],
    burden:
      '"납품 끝나니 잠적했다", "버그 하나 고치려고 새 업체에 처음부터" 같은 일. 영구 보장으로 출시 이후를 혼자 떠안지 않게 합니다.',
  },
];

export function ServiceScopeSection() {
  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          <span className={styles.desktopDescriptionLine}>
            만드는 것에서 끝나지 않습니다. 세상에 띄우고, 지키고, 끝까지
            돌보는 일까지.
          </span>
          <br className={styles.desktopLineBreak} />
          <span className={styles.mobileDescriptionLine}>
            만드는 것에서 끝나지 않습니다.
          </span>
          <span className={styles.mobileDescriptionLine}>
            세상에 띄우고, 지키고, 끝까지 돌보는 일까지.
          </span>
          고객님이 신경 쓸 일을 하나씩 덜어냅니다.
        </>
      }
      label="어디까지 해주시나요"
      order="04"
      title={
        <>
          아이디어만 가져오세요
          <br />
          나머지는 전부 제로소싱이 담당합니다
        </>
      }
    >
      <div className={styles.content} data-node-id="138:4630">
        <div className={styles.stepList}>
          {steps.map((step) => (
            <article className={styles.step} key={step.phase}>
              <div className={styles.phaseCard}>
                <p className={styles.phase}>{step.phase}</p>
                <div className={styles.phaseTitleGroup}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepSubtitle}>{step.subtitle}</p>
                </div>
              </div>
              <div className={styles.detailCard}>
                <p className={styles.description}>
                  {step.description.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
                <ul className={styles.featureGrid}>
                  {step.items.map((item) => (
                    <li className={styles.featureItem} key={item}>
                      <span className={styles.featureIcon} aria-hidden="true">
                        <Icon name="check" size={10} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className={styles.burdenBox}>
                  <span className={styles.burdenBadge}>덜어드리는 부담</span>
                  <p className={styles.burdenText}>{step.burden}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.summary}>
          <p>다섯 단계를 따로 맡기면 견적·소통·책임이 흩어집니다.</p>
          <p className={styles.summaryLine}>
            <span>제로소싱은 이 전부를</span>
            <span>
              <strong>한 팀이 책임지는 단일 창구</strong>입니다.
            </span>
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
