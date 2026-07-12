"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchInput } from "@repo/ui/search-input";

import { CardCarousel } from "../../components/CardCarousel";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import {
  blogListPosts,
  featuredBlogPost,
  topBlogPosts,
  type BlogPost,
} from "./blog-posts";
import styles from "./blog.module.css";

const featuredPost = featuredBlogPost;
const topPosts = topBlogPosts;
const listPosts = blogListPosts;

function Meta({ date }: { date: string }) {
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

function CategoryChip({ children }: { children: string }) {
  return <span className={styles.categoryChip}>{children}</span>;
}

function TopPostCard({ post }: { post: BlogPost }) {
  return (
    <Link className={styles.topCard} href={`/blog/${post.slug}`}>
      <div className={styles.topThumbnail}>
        {post.isNew ? <span className={styles.newBadge}>NEW</span> : null}
      </div>
      <div className={styles.topCopy}>
        <div className={styles.topText}>
          <CategoryChip>{post.category}</CategoryChip>
          <div className={styles.topTitleGroup}>
            <h3 className={styles.postTitle}>{post.title}</h3>
            <p className={styles.topDescription}>{post.description}</p>
          </div>
        </div>
        <Meta date={post.date} />
      </div>
    </Link>
  );
}

function ListPostCard({ post }: { post: BlogPost }) {
  return (
    <Link className={styles.listCard} href={`/blog/${post.slug}`}>
      <div aria-hidden="true" className={styles.listThumbnail} />
      <div className={styles.listCopy}>
        <div className={styles.listText}>
          <CategoryChip>{post.category}</CategoryChip>
          <div className={styles.listTitleGroup}>
            <h3 className={styles.postTitle}>{post.title}</h3>
            <p className={styles.listDescription}>{post.description}</p>
          </div>
        </div>
        <Meta date={post.date} />
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [query, setQuery] = useState("");
  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return listPosts;
    }

    return listPosts.filter((post) =>
      [post.title, post.description, post.category]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [query]);

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
              견적·비용부터 앱 개발, SEO·GEO, 정부지원사업 활용까지.
              현장에서 얻은 노하우를 글로 나눕니다.
            </p>
          </header>

          <article className={styles.featuredCard}>
            <div className={styles.featuredCopy}>
              <CategoryChip>{featuredPost.category}</CategoryChip>
              <div className={styles.featuredText}>
                <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                <p className={styles.featuredDescription}>
                  {featuredPost.description}
                </p>
              </div>
            </div>
          </article>

          <CardCarousel
            bleed={20}
            carouselGap={20}
            gap={21}
            minItemWidth={346}
            mobileItemWidth={330}
            snapAlign="center"
          >
            {topPosts.map((post) => (
              <TopPostCard key={post.title} post={post} />
            ))}
          </CardCarousel>

          <div className={styles.contentGrid}>
            <section className={styles.listColumn} aria-label="블로그 글 목록">
              <SearchInput
                aria-label="블로그 검색"
                onValueChange={setQuery}
                style={{ width: "100%" }}
                value={query}
              />

              <div className={styles.postList}>
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, index) => (
                    <ListPostCard
                      key={`${post.title}-${post.description}-${index}`}
                      post={post}
                    />
                  ))
                ) : (
                  <p className={styles.emptyText}>검색 결과가 없습니다.</p>
                )}
              </div>
            </section>

            <aside className={styles.stickyColumn} aria-hidden="true" />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
