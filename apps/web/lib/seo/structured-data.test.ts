import { describe, expect, it } from "vitest";

import {
  ORGANIZATION_ID,
  createBlogPostingJsonLd,
  createBreadcrumbJsonLd,
  createServiceJsonLd,
  serializeJsonLd,
} from "./structured-data";

const organizationReference = {
  "@type": "Organization",
  "@id": "https://www.zerosourcing.kr/#organization",
  name: "제로소싱",
  url: "https://www.zerosourcing.kr",
};

describe("page-specific structured data", () => {
  it("builds a routed Service connected to the canonical organization", () => {
    expect(ORGANIZATION_ID).toBe("https://www.zerosourcing.kr/#organization");
    expect(
      createServiceJsonLd({
        description: "핵심 기능만 담아 검증하는 개발 서비스",
        name: "MVP 개발",
        path: "/service/mvp",
        serviceType: "MVP 개발",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.zerosourcing.kr/service/mvp#service",
      areaServed: {
        "@type": "Country",
        name: "대한민국",
      },
      description: "핵심 기능만 담아 검증하는 개발 서비스",
      name: "MVP 개발",
      provider: organizationReference,
      serviceType: "MVP 개발",
      url: "https://www.zerosourcing.kr/service/mvp",
    });
  });

  it("builds ordered absolute breadcrumbs", () => {
    expect(
      createBreadcrumbJsonLd([
        { name: "Index", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: "글 제목", path: "/blog/example" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          item: "https://www.zerosourcing.kr/",
          name: "Index",
          position: 1,
        },
        {
          "@type": "ListItem",
          item: "https://www.zerosourcing.kr/blog",
          name: "Blog",
          position: 2,
        },
        {
          "@type": "ListItem",
          item: "https://www.zerosourcing.kr/blog/example",
          name: "글 제목",
          position: 3,
        },
      ],
    });
  });

  it("builds a BlogPosting and emits only a record-owned image", () => {
    const input = {
      category: "MVP",
      description: "MVP 준비 체크리스트",
      publishedDate: "2026-07-12",
      slug: "mvp-checklist",
      title: "MVP 개발 전 준비할 것",
      updatedAt: "2026-07-14T01:02:03+00:00",
    } as const;

    expect(createBlogPostingJsonLd({ ...input, imageUrl: null })).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "https://www.zerosourcing.kr/blog/mvp-checklist#blog-posting",
      articleSection: "MVP",
      author: organizationReference,
      dateModified: "2026-07-14T01:02:03+00:00",
      datePublished: "2026-07-12",
      description: "MVP 준비 체크리스트",
      headline: "MVP 개발 전 준비할 것",
      inLanguage: "ko-KR",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://www.zerosourcing.kr/blog/mvp-checklist",
      },
      publisher: organizationReference,
      url: "https://www.zerosourcing.kr/blog/mvp-checklist",
    });

    expect(
      createBlogPostingJsonLd({
        ...input,
        imageUrl: "https://cdn.example.com/mvp-checklist.webp",
      }),
    ).toMatchObject({
      image: ["https://cdn.example.com/mvp-checklist.webp"],
    });
  });

  it("escapes less-than characters before embedding JSON in HTML", () => {
    const serialized = serializeJsonLd({
      name: "</script><script>alert(1)</script>",
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});
