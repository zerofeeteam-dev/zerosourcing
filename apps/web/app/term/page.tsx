import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { createPageMetadata } from "../site-metadata";
import { termsChapters, termsEffectiveDate, type TermsBlock } from "./content";
import styles from "./page.module.css";

export const metadata = createPageMetadata({
  title: "제로소싱 | 사이트 이용약관",
  description:
    "제로소싱 웹사이트와 외주 개발 문의 서비스의 이용 기준 및 개별 개발 계약과의 관계를 안내합니다.",
  path: "/term",
});

function TermsBlockContent({ block }: { block: TermsBlock }) {
  if (block.type === "paragraph") {
    return <p className={styles.paragraph}>{block.text}</p>;
  }

  return (
    <ol className={styles.orderedList}>
      {block.items.map((item, index) => (
        <li
          className={styles.listItem}
          key={`${item.number ?? index + 1}-${item.text}`}
          value={item.number}
        >
          <span>{item.text}</span>
          {item.subitems ? (
            <ul className={styles.unorderedList}>
              {item.subitems.map((subitem) => (
                <li className={styles.subitem} key={subitem}>
                  {subitem}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.headerLayer}>
        <Header />
      </div>

      <div className={styles.content}>
        <article className={styles.document}>
          <header className={styles.documentHeader}>
            <h1 className={styles.title}>사이트 이용약관</h1>
          </header>

          <div className={styles.chapterList}>
            {termsChapters.map((chapter) => (
              <section className={styles.chapter} key={chapter.title}>
                <h2 className={styles.chapterTitle}>{chapter.title}</h2>
                <div className={styles.articleList}>
                  {chapter.articles.map((article) => (
                    <section className={styles.article} key={article.title}>
                      <h3 className={styles.articleTitle}>{article.title}</h3>
                      <div className={styles.blocks}>
                        {article.blocks.map((block, index) => (
                          <TermsBlockContent
                            block={block}
                            key={`${block.type}-${index}`}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className={styles.supplement}>
            <h2 className={styles.chapterTitle}>부칙</h2>
            <p className={styles.paragraph}>{termsEffectiveDate}</p>
          </section>
        </article>
      </div>

      <Footer />
    </main>
  );
}
