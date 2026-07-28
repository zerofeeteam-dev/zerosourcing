import { describe, expect, it } from "vitest";

import type { BlogCard, PortfolioCard } from "../public-content/types";
import {
  createAboutMarkdown,
  createBlogMarkdown,
  createFaqMarkdown,
  createLlmsFullMarkdown,
  createLlmsIndexMarkdown,
  createPortfolioMarkdown,
  createServiceMarkdown,
} from "./llms-content";
import { createLlmsResponse } from "./llms-response";

const blog: BlogCard = {
  bannerAlt: "",
  bannerPublished: false,
  bannerUrl: null,
  category: "MVP",
  date: "2026. 07. 28.",
  landingPublished: true,
  publishedDate: "2026-07-28",
  slug: "mvp-checklist",
  summary: "MVP [준비] 체크리스트\n핵심 요약",
  thumbnailAlt: "MVP 준비 화면",
  thumbnailUrl: "https://cdn.example.com/mvp.webp",
  title: "MVP *개발* 전 준비할 것",
  type: "mvp",
  updatedAt: "2026-07-28T00:00:00.000Z",
};

const portfolio: PortfolioCard = {
  category: "MVP",
  description: "핵심 기능을 검증한 예약 서비스",
  duration: "4주",
  estimate: "1,000만원",
  featuredPublished: true,
  features: ["예약"],
  landingPublished: true,
  scope: ["기획", "개발"],
  servicePublished: true,
  slug: "booking-mvp",
  thumbnailAlt: "예약 서비스 화면",
  thumbnailUrl: "https://cdn.example.com/booking.webp",
  title: "예약 MVP",
  type: "mvp",
  updatedAt: "2026-07-28T00:00:00.000Z",
};

describe("LLM-readable content", () => {
  it("keeps llms.txt concise while linking every detailed Markdown surface", () => {
    const content = createLlmsIndexMarkdown();

    expect(content).toMatch(/^# 제로소싱\n\n> /);
    expect(content).toContain("https://www.zerosourcing.kr/llms-full.txt");
    expect(content).toContain("https://www.zerosourcing.kr/service/mvp.md");
    expect(content).toContain("https://www.zerosourcing.kr/about.md");
    expect(content).toContain("https://www.zerosourcing.kr/faq.md");
    expect(content).toContain("확인되지 않은 가격");
    expect(content).not.toContain("zerosourcing.com");
  });

  it("derives service, company, and FAQ documents from public page content", () => {
    expect(createServiceMarkdown("mvp")).toContain("예비창업패키지");
    expect(createServiceMarkdown("app")).toContain("푸시 알림");
    expect(createServiceMarkdown("companyHomepage")).toContain(
      "검색·AI 노출 세팅",
    );
    expect(createAboutMarkdown()).toContain("사업자등록번호");

    const faq = createFaqMarkdown();
    expect(faq).toContain("# 제로소싱 자주 묻는 질문");
    expect(faq.match(/개발 기간은 보통 얼마나 걸리나요\?/gu)).toHaveLength(1);
  });

  it("adds current public content and escapes Markdown control characters", () => {
    const input = { blogs: [blog], portfolios: [portfolio] };
    const full = createLlmsFullMarkdown(input);

    expect(full).toContain("https://www.zerosourcing.kr/blog/mvp-checklist");
    expect(full).toContain("https://www.zerosourcing.kr/portfolio/booking-mvp");
    expect(full).toContain("MVP \\*개발\\* 전 준비할 것");
    expect(full).toContain("MVP \\[준비\\] 체크리스트 핵심 요약");
    expect(full).toContain("### 일하는 원칙");
    expect(createBlogMarkdown(input)).toContain("2026. 07. 28.");
    expect(createPortfolioMarkdown(input)).toContain("공개 견적 1,000만원");
  });

  it("keeps static guidance available when dynamic sources are unavailable", () => {
    const input = {
      blogs: [],
      portfolios: [],
      unavailableSources: ["blog", "portfolio"] as const,
    };
    const full = createLlmsFullMarkdown(input);

    expect(full).toContain("# 제로소싱 전체 안내");
    expect(full).toContain("동적 목록을 일시적으로 불러오지 못했습니다");
    expect(full).toContain("### MVP 개발");
  });
});

describe("LLM-readable responses", () => {
  it("serves Markdown mirrors with a canonical and duplicate-index guard", () => {
    const response = createLlmsResponse("# 문서\n", {
      canonicalPath: "/about",
      format: "markdown",
    });

    expect(response.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("content-language")).toBe("ko");
    expect(response.headers.get("link")).toBe(
      '<https://www.zerosourcing.kr/about>; rel="canonical"',
    );
    expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
  });

  it("prevents caching and marks partial dynamic documents", () => {
    const response = createLlmsResponse("# 부분 문서\n", {
      format: "text",
      partial: true,
    });

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(response.headers.get("x-llms-content-status")).toBe("partial");
  });
});
