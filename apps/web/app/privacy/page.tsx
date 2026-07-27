import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { createPageMetadata } from "../site-metadata";
import sharedStyles from "../term/page.module.css";
import {
  privacyArticles,
  privacyIntroduction,
  type PrivacyBlock,
  type PrivacyListItem,
} from "./content";
import styles from "./page.module.css";

export const metadata = createPageMetadata({
  title: "제로소싱 | 개인정보처리방침",
  description:
    "제로소싱 외주 문의 과정에서 수집하는 개인정보의 항목, 이용 목적, 보유기간 및 처리 위탁·국외 이전 사항을 안내합니다.",
  path: "/privacy",
});

function PrivacyListItemContent({ item }: { item: PrivacyListItem }) {
  const isExternal = item.href?.startsWith("http");

  return (
    <>
      {item.text}
      {item.href && item.linkLabel ? (
        <a
          className={styles.link}
          href={item.href}
          rel={isExternal ? "noreferrer" : undefined}
          target={isExternal ? "_blank" : undefined}
        >
          {item.linkLabel}
        </a>
      ) : null}
      {item.suffix}
      {item.subitems ? (
        <PrivacyList items={item.subitems} type="unordered-list" />
      ) : null}
    </>
  );
}

function PrivacyList({
  items,
  type,
}: {
  items: readonly PrivacyListItem[];
  type: "ordered-list" | "unordered-list";
}) {
  const List = type === "ordered-list" ? "ol" : "ul";
  const listClassName =
    type === "ordered-list"
      ? sharedStyles.orderedList
      : sharedStyles.unorderedList;
  const itemClassName =
    type === "ordered-list" ? sharedStyles.listItem : sharedStyles.subitem;

  return (
    <List className={listClassName}>
      {items.map((item, index) => (
        <li className={itemClassName} key={`${item.text}-${index}`}>
          <PrivacyListItemContent item={item} />
        </li>
      ))}
    </List>
  );
}

function PrivacyBlockContent({ block }: { block: PrivacyBlock }) {
  if (block.type === "paragraph") {
    return <p className={sharedStyles.paragraph}>{block.text}</p>;
  }

  return <PrivacyList items={block.items} type={block.type} />;
}

export default function PrivacyPage() {
  return (
    <main className={sharedStyles.page}>
      <div className={sharedStyles.headerLayer}>
        <Header />
      </div>

      <div className={sharedStyles.content}>
        <article className={sharedStyles.document}>
          <header className={sharedStyles.documentHeader}>
            <h1 className={sharedStyles.title}>개인정보처리방침</h1>
            <p className={sharedStyles.paragraph}>{privacyIntroduction}</p>
          </header>

          <div className={sharedStyles.articleList}>
            {privacyArticles.map((article) => (
              <section className={sharedStyles.article} key={article.title}>
                <h2 className={sharedStyles.articleTitle}>{article.title}</h2>
                <div className={sharedStyles.blocks}>
                  {article.blocks.map((block, index) => (
                    <PrivacyBlockContent
                      block={block}
                      key={`${block.type}-${index}`}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>

      <Footer />
    </main>
  );
}
