import { SectionShell } from "./SectionShell";
import styles from "./CompanyHomepageScopeSection.module.css";

const scopeItems = [
  {
    body: "PC·태블릿·모바일 어디서든 단정하게 보이도록.",
    eyebrow: "RESPONSIVE",
    title: "반응형 제작",
  },
  {
    body: "만들고 끝이 아니라, 검색과 AI 답변에 잡히게.",
    eyebrow: "SEO·GEO",
    title: "검색·AI 노출 세팅",
  },
  {
    body: "방문자가 바로 연락할 수 있는 문의 창구.",
    eyebrow: "FORM",
    title: "문의·상담 폼",
  },
  {
    body: "글·이미지·공지를 외주 없이 직접 관리.",
    eyebrow: "CMS",
    title: "콘텐츠 직접 수정",
  },
  {
    body: "도메인 연결, 서버 운영, SSL 보안까지.",
    eyebrow: "INFRA",
    title: "도메인·서버·보안",
  },
] as const;

export function CompanyHomepageScopeSection() {
  return (
    <SectionShell
      className={styles.section}
      description="복잡한 기능은 없습니다. 대신 기업 홈페이지에 꼭 필요한 것들을, 빠짐없이 챙깁니다."
      label="홈페이지 제작 범위"
      order="04"
      title={
        <>
          기업 홈페이지 제작에
          <br />
          포함되는 것
        </>
      }
    >
      <div className={styles.grid} data-node-id="49:4396">
        {scopeItems.map((item) => (
          <article className={styles.card} key={item.eyebrow}>
            <div className={styles.cardInner}>
              <p className={styles.eyebrow}>{item.eyebrow}</p>
              <div className={styles.copy}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardBody}>{item.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
