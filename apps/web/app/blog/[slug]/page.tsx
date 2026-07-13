import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { createPageMetadata } from "../../site-metadata";
import {
  blogPosts,
  type BlogPost,
} from "../blog-posts";
import { BlogDetailCtaButton } from "./BlogDetailCtaButton";
import styles from "./blog-detail.module.css";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return {};
  }

  return createPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
  });
}

function CategoryChip({ children }: { children: string }) {
  return <span className={styles.categoryChip}>{children}</span>;
}

function RelatedCategoryChip({ children }: { children: string }) {
  return <span className={styles.relatedCategoryChip}>{children}</span>;
}

function Meta({ post }: { post: BlogPost }) {
  return (
    <p className={styles.meta}>
      <span aria-hidden="true" className={styles.metaMark}>
        <Image
          alt=""
          height={16}
          src="/brand/zerofee-blog-mark.svg"
          width={16}
        />
      </span>
      {post.author} <strong>·</strong> {post.date}
    </p>
  );
}

function RelatedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link className={styles.relatedCard} href={`/blog/${post.slug}`}>
      <div aria-hidden="true" className={styles.relatedThumbnail} />
      <div className={styles.relatedCopy}>
        <div className={styles.relatedText}>
          <RelatedCategoryChip>{post.category}</RelatedCategoryChip>
          <div className={styles.relatedTitleGroup}>
            <h3 className={styles.relatedTitle}>{post.title}</h3>
            <p className={styles.relatedDescription}>{post.description}</p>
          </div>
        </div>
        <Meta post={post} />
      </div>
    </Link>
  );
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = post.relatedSlugs
    .map((relatedSlug) => blogPosts.find((item) => item.slug === relatedSlug))
    .filter((item): item is BlogPost => Boolean(item));

  return (
    <main className={styles.page}>
      <div className={styles.headerLayer}>
        <Header />
      </div>

      <section className={styles.detailSection}>
        <div className={styles.content}>
          <article className={styles.articleShell}>
            <header className={styles.hero}>
              <div className={styles.heading}>
                <div className={styles.kicker}>
                  <CategoryChip>{post.category}</CategoryChip>
                  <p className={styles.breadcrumb}>
                    Index / Blog / {post.title} /
                  </p>
                </div>
                <h1 className={styles.title}>{post.title}</h1>
              </div>
              <p className={styles.description}>{post.description}</p>
              <Meta post={post} />
            </header>

            <div
              className={styles.articleBody}
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            <section className={styles.ctaBanner}>
              <div className={styles.ctaCopy}>
                <h2 className={styles.ctaTitle}>
                  부담은 제로, 출시는 현실로
                  <br />
                  MVP·홈페이지 개발 파트너, 제로소싱
                </h2>
                <p className={styles.ctaDescription}>
                  과한 스펙도, 긴 일정도 없이. 핵심만 담아 빠르게 검증하는
                  MVP 개발 파트너.
                </p>
              </div>
              <BlogDetailCtaButton />
            </section>

            <Link className={styles.backLink} href="/blog">
              목록으로
            </Link>
          </article>

          <section className={styles.relatedSection}>
            <h2 className={styles.relatedHeading}>함께 읽으면 좋은 글</h2>
            <div className={styles.relatedList}>
              {relatedPosts.map((relatedPost, index) => (
                <RelatedPostCard
                  key={`${relatedPost.slug}-${index}`}
                  post={relatedPost}
                />
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
