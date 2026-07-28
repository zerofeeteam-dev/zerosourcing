import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { createPageMetadata } from "../../site-metadata";
import sharedStyles from "../../term/page.module.css";
import { consentNotices } from "./content";
import styles from "./page.module.css";

export const metadata = createPageMetadata({
  title: "제로소싱 | 개인정보 동의 안내",
  description:
    "제로소싱 외주 문의를 위한 개인정보 수집·이용 및 개인정보 국외 이전 동의 내용을 안내합니다.",
  path: "/privacy/consent",
});

export default function PrivacyConsentPage() {
  return (
    <main className={sharedStyles.page}>
      <div className={sharedStyles.headerLayer}>
        <Header />
      </div>

      <div className={sharedStyles.content}>
        <article className={sharedStyles.document}>
          <header className={sharedStyles.documentHeader}>
            <h1 className={sharedStyles.title}>개인정보 동의 안내</h1>
            <p className={sharedStyles.paragraph}>
              외주 문의 접수를 위해 필요한 개인정보 수집·이용 및 국외 이전 동의
              내용을 안내합니다.
            </p>
          </header>

          <div className={sharedStyles.articleList}>
            {consentNotices.map((notice) => (
              <section
                className={`${sharedStyles.article} ${styles.noticeSection}`}
                id={notice.id}
                key={notice.id}
              >
                <h2 className={sharedStyles.articleTitle}>{notice.title}</h2>
                <dl className={styles.noticeList}>
                  {notice.rows.map((row) => (
                    <div className={styles.noticeRow} key={row.label}>
                      <dt className={styles.noticeTerm}>{row.label}</dt>
                      <dd className={styles.noticeDescription}>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </article>
      </div>

      <Footer />
    </main>
  );
}
