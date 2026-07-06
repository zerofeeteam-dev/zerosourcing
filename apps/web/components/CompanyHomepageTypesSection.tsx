import { Icon, type IconName } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./CompanyHomepageTypesSection.module.css";

const homepageTypes: {
  description: string;
  iconName: IconName;
  title: string;
}[] = [
  {
    description: "회사·연혁·사업을 신뢰감 있게 전달.",
    iconName: "message-typing",
    title: "회사 소개형",
  },
  {
    description: "비주얼 중심으로 브랜드 인상을 강하게.",
    iconName: "pen-tool-03",
    title: "브랜드형",
  },
  {
    description: "제품·서비스를 보기 쉽게 정리해 문의로 연결.",
    iconName: "package-02",
    title: "제품·서비스 소개형",
  },
  {
    description: "인재에게 회사의 매력과 비전을 전달.",
    iconName: "user-profile-03",
    title: "채용 홈페이지",
  },
  {
    description: "한 페이지로 전환에 집중하는 캠페인용.",
    iconName: "stars",
    title: "랜딩페이지",
  },
  {
    description: "낡은 홈페이지를 최신 반응형으로 새단장.",
    iconName: "home-02",
    title: "홈페이지 리뉴얼",
  },
];

export function CompanyHomepageTypesSection() {
  return (
    <SectionShell
      className={styles.section}
      description="회사의 성격과 목적에 맞춰, 필요한 형태로 제작합니다."
      label="홈페이지 제작 종류"
      order="02"
      title={
        <>
          이런 기업 홈페이지를
          <br />
          만듭니다
        </>
      }
    >
      <div className={styles.grid} data-node-id="49:3828">
        {homepageTypes.map((type) => (
          <article className={styles.card} key={type.title}>
            <div className={styles.header}>
              <span className={styles.iconFrame}>
                <Icon name={type.iconName} size={24} />
              </span>
              <h3 className={styles.cardTitle}>{type.title}</h3>
            </div>
            <p className={styles.cardDescription}>{type.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
