import { SectionShell } from "./SectionShell";
import styles from "./AppDevelopmentScopeSection.module.css";

type Difference = {
  eyebrow: string;
  items: string[];
  subtitle: string;
  summary: string;
  title: string;
};

const includedItems = ["기획", "디자인", "웹 개발"] as const;

const differences: Difference[] = [
  {
    eyebrow: "DIFFERENCE 01",
    items: [
      "웹을 React Native로 감싸 앱 빌드",
      "푸시·결제·카메라 등 네이티브 연동",
      "iOS·안드로이드 빌드 동시 설정",
      "실기기 테스트로 앱다운 동작 확인",
    ],
    subtitle: "React Native Packaging",
    summary: "웹사이트를 앱처럼이 아니라, 진짜 앱으로 만드는 핵심 단계",
    title: "RN 패키징",
  },
  {
    eyebrow: "DIFFERENCE 02",
    items: [
      "개발자 계정 설정 안내",
      "스토어 등록 자료 준비",
      "애플·구글 심사 대응",
      "출시 후 버그 영구 보장",
    ],
    subtitle: "App Store · Google Play",
    summary: "비개발자가 가장 막막해하는 단계를, 끝까지 대신합니다",
    title: "스토어 등록 대행",
  },
];

export function AppDevelopmentScopeSection() {
  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          개발만 던져주고 끝내지 않습니다. 가장 까다로운 스토어 등록까지
          대행해,
          <br />
          출시 버튼만 누르면 되도록 준비합니다. 각 단계에서 실제로 무엇을
          하는지 정리했습니다.
        </>
      }
      label="앱 개발 범위"
      order="04"
      title={
        <>
          기획·디자인·개발부터
          <br />
          스토어 등록까지
        </>
      }
    >
      <div className={styles.content} data-node-id="43:3826">
        <div className={styles.included}>
          <p className={styles.includedLabel}>기본 포함</p>
          <div className={styles.includedItems}>
            {includedItems.map((item, index) => (
              <span className={styles.includedPair} key={item}>
                {index > 0 ? <span className={styles.plus}>+</span> : null}
                <span className={styles.includedChip}>{item}</span>
              </span>
            ))}
          </div>
        </div>

        <div className={styles.cards}>
          {differences.map((difference) => (
            <article className={styles.card} key={difference.title}>
              <div className={styles.cardHeader}>
                <p className={styles.eyebrow}>{difference.eyebrow}</p>
                <div className={styles.titleGroup}>
                  <h3 className={styles.cardTitle}>{difference.title}</h3>
                  <p className={styles.subtitle}>{difference.subtitle}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.summary}>{difference.summary}</p>
                <ul className={styles.itemList}>
                  {difference.items.map((item) => (
                    <li className={styles.item} key={item}>
                      <span className={styles.zMark} aria-hidden="true">
                        Z
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.notice}>
          <p className={styles.noticeTitle}>등록 대행 포함</p>
          <p className={styles.noticeText}>
            스토어 등록은 비개발자가 가장 막막해하는 단계입니다.
            <br />
            개발자 계정 설정부터 스토어 등록 자료 준비, 반려 사유가 까다로운{" "}
            <strong>애플·구글 심사 대응까지</strong> 제로소싱이 맡습니다. 처음
            앱을 내는 분도 심사에 헤매지 않고 출시할 수 있고, 출시 후{" "}
            <strong>버그는 기간 제한 없이 영구 보장</strong>합니다.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
