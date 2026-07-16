"use client";

import { SearchInput } from "@repo/ui/search-input";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CardCarousel } from "../../components/CardCarousel";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { ManagedThumbnail } from "../../components/ManagedThumbnail";
import type { BlogCard } from "../../lib/public-content/types";
import styles from "./blog.module.css";

type BlogListClientProps = {
  readonly featured: BlogCard | null;
  readonly items: readonly BlogCard[];
  readonly top: readonly BlogCard[];
};

function Meta({ date }: { readonly date: string }) {
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
      제로소싱 <strong>·</strong> {date}
    </p>
  );
}

function CategoryChip({ children }: { readonly children: string }) {
  return <span className={styles.categoryChip}>{children}</span>;
}

function TopPostCard({ post }: { readonly post: BlogCard }) {
  return (
    <Link className={styles.topCard} href={`/blog/${post.slug}`}>
      <div className={styles.topThumbnail}>
        <ManagedThumbnail
          alt=""
          className={styles.topThumbnailMedia!}
          sizes="(max-width: 480px) 330px, 346px"
          url={post.thumbnailUrl}
        />
        <span className={styles.newBadge}>NEW</span>
      </div>
      <div className={styles.topCopy}>
        <div className={styles.topText}>
          <CategoryChip>{post.category}</CategoryChip>
          <div className={styles.topTitleGroup}>
            <h3 className={styles.postTitle}>{post.title}</h3>
            <p className={styles.topDescription}>{post.summary}</p>
          </div>
        </div>
        <Meta date={post.date} />
      </div>
    </Link>
  );
}

function ListPostCard({ post }: { readonly post: BlogCard }) {
  return (
    <Link className={styles.listCard} href={`/blog/${post.slug}`}>
      <ManagedThumbnail
        alt=""
        className={styles.listThumbnail!}
        sizes="(max-width: 560px) calc(100vw - 40px), (max-width: 768px) 220px, 240px"
        url={post.thumbnailUrl}
      />
      <div className={styles.listCopy}>
        <div className={styles.listText}>
          <CategoryChip>{post.category}</CategoryChip>
          <div className={styles.listTitleGroup}>
            <h3 className={styles.postTitle}>{post.title}</h3>
            <p className={styles.listDescription}>{post.summary}</p>
          </div>
        </div>
        <Meta date={post.date} />
      </div>
    </Link>
  );
}

export function BlogListClient({ featured, items, top }: BlogListClientProps) {
  const [query, setQuery] = useState("");
  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    return items.filter((post) =>
      [post.title, post.summary, post.category]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [items, query]);
  const hasRecords = featured !== null || items.length > 0;
  const hasSearchQuery = query.trim().length > 0;
  const featuredImageUrl =
    featured?.bannerUrl ?? featured?.thumbnailUrl ?? null;

  return (
    <main className={styles.page}>
      <div className={styles.headerLayer}>
        <Header />
      </div>

      <section className={styles.blogSection}>
        <div className={styles.inner}>
          <header className={styles.intro}>
            <div className={styles.heading}>
              <div className={styles.kicker}>
                <span className={styles.kickerChip}>Blog</span>
                <p className={styles.kickerText}>제로소싱 인사이트</p>
              </div>
              <h1 className={styles.title}>외주 개발을 더 잘하는 방법</h1>
            </div>
            <p className={styles.description}>
              맡기기 전 알아야 할 것들.
              <br />
              견적·비용부터 앱 개발, SEO·GEO, 정부지원사업 활용까지. 현장에서
              얻은 노하우를 글로 나눕니다.
            </p>
          </header>

          {featured ? (
            <Link
              aria-label={`${featured.title} 글 보기`}
              className={`${styles.featuredCard} ${
                featuredImageUrl ? "" : styles.featuredCardFallback
              }`}
              href={`/blog/${featured.slug}`}
            >
              <ManagedThumbnail
                alt={featured.bannerAlt || featured.thumbnailAlt}
                className={styles.featuredThumbnail!}
                sizes="(max-width: 1080px) calc(100vw - 40px), 1080px"
                url={featuredImageUrl}
              />
              {featuredImageUrl ? (
                <span aria-hidden="true" className={styles.featuredOverlay} />
              ) : null}
              <div className={styles.featuredCopy}>
                <CategoryChip>{featured.category}</CategoryChip>
                <div className={styles.featuredText}>
                  <h2 className={styles.featuredTitle}>{featured.title}</h2>
                  <p className={styles.featuredDescription}>
                    {featured.summary}
                  </p>
                </div>
              </div>
            </Link>
          ) : null}

          {top.length > 0 ? (
            <CardCarousel
              bleed={20}
              carouselGap={20}
              gap={21}
              minItemWidth={346}
              mobileItemWidth={330}
              snapAlign="center"
            >
              {top.map((post) => (
                <TopPostCard key={post.slug} post={post} />
              ))}
            </CardCarousel>
          ) : null}

          <div className={styles.contentGrid}>
            <section className={styles.listColumn} aria-label="블로그 글 목록">
              <SearchInput
                aria-label="블로그 검색"
                onValueChange={setQuery}
                style={{ width: "100%" }}
                value={query}
              />

              <div className={styles.postList}>
                {!hasRecords ? (
                  <p className={styles.emptyText}>등록된 글이 없습니다.</p>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <ListPostCard key={post.slug} post={post} />
                  ))
                ) : hasSearchQuery ? (
                  <p className={styles.emptyText}>검색 결과가 없습니다.</p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
