import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { ManagedContent } from "../../../components/ManagedContent";
import { ManagedThumbnail } from "../../../components/ManagedThumbnail";
import {
  getPublishedBlogPost,
  getRelatedBlogPosts,
} from "../../../lib/public-content/queries";
import type { BlogCard, BlogDetail } from "../../../lib/public-content/types";
import { createPageMetadata } from "../../site-metadata";
import { BlogDetailCtaButton } from "./BlogDetailCtaButton";
import styles from "./blog-detail.module.css";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) {
    return {};
  }

  return createPageMetadata({
    title: post.title,
    description: post.seoDescription || post.summary,
    path: `/blog/${post.slug}`,
  });
}

function CategoryChip({ children }: { readonly children: string }) {
  return <span className={styles.categoryChip}>{children}</span>;
}

function RelatedCategoryChip({ children }: { readonly children: string }) {
  return <span className={styles.relatedCategoryChip}>{children}</span>;
}

function Meta({ post }: { readonly post: BlogCard | BlogDetail }) {
  const author = "author" in post ? post.author : "제로소싱";

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
      {author} <strong>·</strong> {post.date}
    </p>
  );
}

function RelatedPostCard({ post }: { readonly post: BlogCard | BlogDetail }) {
  return (
    <Link className={styles.relatedCard} href={`/blog/${post.slug}`}>
      <ManagedThumbnail
        alt=""
        className={styles.relatedThumbnail!}
        sizes="(max-width: 480px) calc(100vw - 40px), 220px"
        url={post.thumbnailUrl}
      />
      <div className={styles.relatedCopy}>
        <div className={styles.relatedText}>
          <RelatedCategoryChip>{post.category}</RelatedCategoryChip>
          <div className={styles.relatedTitleGroup}>
            <h3 className={styles.relatedTitle}>{post.title}</h3>
            <p className={styles.relatedDescription}>{post.summary}</p>
          </div>
        </div>
        <Meta post={post} />
      </div>
    </Link>
  );
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(post.type, post.slug);

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
              <p className={styles.description}>{post.summary}</p>
              <Meta post={post} />
            </header>

            <div className={styles.articleBody}>
              <ManagedContent
                assetBaseEnabled={post.assetBaseEnabled}
                assetScope={post.assetScope}
                authoringMode={post.contentAuthoringMode}
                content={post.content}
                entity="blog"
                outputMode={post.contentMode}
                title={post.title}
              />
            </div>

            <section className={styles.ctaBanner}>
              <div className={styles.ctaCopy}>
                <h2 className={styles.ctaTitle}>
                  부담은 제로, 출시는 현실로
                  <br />
                  MVP·홈페이지 개발 파트너, 제로소싱
                </h2>
                <p className={styles.ctaDescription}>
                  과한 스펙도, 긴 일정도 없이. 핵심만 담아 빠르게 검증하는 MVP
                  개발 파트너.
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
              {relatedPosts.map((relatedPost) => (
                <RelatedPostCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
