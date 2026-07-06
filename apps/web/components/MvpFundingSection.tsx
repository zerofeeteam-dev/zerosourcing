import { SectionShell } from "./SectionShell";
import styles from "./MvpFundingSection.module.css";

const fundingPrograms = [
  {
    tag: "예비창업자",
    title: "예비창업패키지",
    description:
      "창업 전 단계. 사업화 자금과 멘토링을 지원해, 아이디어를 처음 제품으로 만들 때 가장 많이 활용됩니다.",
  },
  {
    tag: "창업 3년 이내",
    title: "초기창업패키지",
    description:
      "이미 창업한 초기 기업의 사업화를 지원. MVP를 고도화하거나 다음 버전으로 확장할 때 적합합니다.",
  },
  {
    tag: "청년 창업자",
    title: "청년창업사관학교",
    description:
      "자금·공간·교육을 함께 지원하는 집중 프로그램. 제품화 일정이 빠듯해 빠른 MVP 개발이 특히 중요합니다.",
  },
  {
    tag: "소상공인·생활창업",
    title: "모두의 창업 외",
    description:
      "신사업창업사관학교 등 다양한 창업 지원사업. 업종에 맞는 웹·앱 형태로 사업 아이템을 구현해 드립니다.",
  },
];

const supportSteps = [
  "데모데이·중간점검 일정에 맞춘 MVP 납기 조율",
  "사업비 집행용 견적서·계약서·증빙 서류 협조",
  "심사·발표에서 강한 '작동하는 데모' 중심 설계",
  "선정 후 확장까지 내다본 구조로 개발",
];
const supportStepText = supportSteps
  .map((step, index) => `${String(index + 1).padStart(2, "0")}. ${step}`)
  .join(" ");

export function MvpFundingSection() {
  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          예비창업패키지·초기창업패키지·청년창업사관학교처럼 경쟁률 높은
          사업일수록,
          <br />
          아이디어를 &apos;작동하는 형태&apos;로 보여주는 팀이 유리합니다.
          그리고 그 MVP는, 받은 지원금으로 만들 수 있습니다.
        </>
      }
      label="정부지원사업과 MVP"
      order="02"
      title={
        <>
          지원사업 합격에도,
          <br />
          MVP가 무기가 됩니다
        </>
      }
    >
      <div className={styles.content} data-node-id="30:1562">
        <div className={styles.alert} data-node-id="30:1536">
          <h3 className={styles.alertTitle}>
            창업 지원금으로 MVP 제작비 집행 가능
          </h3>
          <p className={styles.alertText}>
            대부분의 창업지원사업은{" "}
            <strong>사업화 자금으로 외주 개발비(MVP 제작비) 집행</strong>을
            허용합니다.
            <br />
            즉, 내 돈을 들이지 않고도 검증 가능한 제품을 손에 쥘 수 있습니다.
            제로소싱은 사업비 집행에 필요한 견적서·증빙 서류를 함께 준비해
            드립니다.
          </p>
        </div>

        <div className={styles.programGrid} data-node-id="30:1539">
          {fundingPrograms.map((program) => (
            <article className={styles.programCard} key={program.title}>
              <div className={styles.programInner}>
                <span className={styles.programTag}>{program.tag}</span>
                <div className={styles.programCopy}>
                  <h3 className={styles.programTitle}>{program.title}</h3>
                  <p className={styles.programDescription}>
                    {program.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.notes} data-node-id="30:1688">
          <div className={styles.noteGroup}>
            <p className={styles.noteTitle}>
              ※ 제로소싱이 지원사업을 돕는 방식
            </p>
            <p className={styles.stepText}>{supportStepText}</p>
          </div>
          <p className={styles.noteText}>
            ※ 지원 규모와 사업비 집행 가능 항목은 사업·연도별 공고에 따라
            다릅니다. 선정 후 해당 사업의 집행 기준을 함께 확인해 드리며,
            제로소싱은 지원사업의 선정을 보장하지 않습니다.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
