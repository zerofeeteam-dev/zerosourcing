import { describe, expect, it } from "vitest";

import { categories, getFaqAnchorId } from "../app/faq/content";
import {
  appFaqs,
  appServiceFaqs,
  commonFaqs,
  companyHomepageFaqs,
  companyHomepageServiceFaqs,
  faqById,
  homeFaqs,
  mvpFaqs,
  timelineFaqs,
} from "../content/faqs";

describe("canonical FAQ content", () => {
  it("keeps one stable record for every distinct question", () => {
    const records = Object.values(faqById);

    expect(records).toHaveLength(43);
    expect(new Set(records.map((faq) => faq.id)).size).toBe(records.length);
    expect(new Set(records.map((faq) => faq.question)).size).toBe(
      records.length,
    );
  });

  it("derives every repeated FAQ surface from the canonical records", () => {
    expect(homeFaqs).toBe(commonFaqs);
    expect(timelineFaqs[0]).toBe(faqById["delivery-timeline"]);
    expect(mvpFaqs[0]).toBe(faqById["mvp-feature-scope"]);
    expect(appFaqs[1]).toBe(faqById["dual-platform-app-delivery"]);
    expect(appServiceFaqs[1]).toBe(faqById["dual-platform-app-delivery"]);
    expect(companyHomepageFaqs[1]).toBe(faqById["cms-content-updates"]);
    expect(companyHomepageServiceFaqs[1]).toBe(faqById["cms-content-updates"]);
  });

  it("uses the approved FAQ-hub answers on every surface", () => {
    expect(faqById["delivery-timeline"].answer).toBe(
      "제로소싱의 MVP 개발 기간은 평균 4주 내외입니다. 풀스펙으로 6개월씩 끄는 대신, 검증에 꼭 필요한 핵심 기능만 담아 빠르게 출시합니다. 상담에서 기능 범위를 확정한 뒤 정확한 일정을 약속드리고, 진행 중 변동이 생기면 즉시 공유합니다.",
    );
    expect(faqById["dual-platform-app-delivery"].answer).toBe(
      "네. 제로소싱은 웹뷰 하이브리드 방식으로 한 번 개발해 iOS와 안드로이드에 동시 출시합니다.",
    );
    expect(faqById["app-store-registration"].answer).toBe(
      "네. 개발자 계정 설정 안내부터 스토어 등록 자료 준비, 심사 대응까지 함께 진행합니다.",
    );
    expect(faqById["cms-content-updates"].answer).toBe(
      "네. 글과 이미지를 직접 바꿀 수 있는 콘텐츠 관리 기능(CMS)을 기본 제공합니다.",
    );
    expect(faqById["search-engine-optimization"].answer).toBe(
      "네. 메타태그, 사이트맵, 구조화 데이터, 페이지 속도처럼 기본 SEO 세팅을 함께 적용합니다.",
    );
    expect(faqById["ai-search-discoverability"].answer).toBe(
      "회사와 서비스 정보를 구조화해 AI가 인용하기 쉬운 형태로 정리합니다.",
    );
    expect(faqById["company-domain-hosting-ssl"].answer).toBe(
      "네. 도메인 연결, 서버 배포, SSL 보안 설정까지 함께 진행할 수 있습니다.",
    );
  });

  it("gives every FAQ-hub occurrence a unique stable anchor", () => {
    const anchors = categories.flatMap((category) =>
      category.items.map((faq) => getFaqAnchorId(category.id, faq.id)),
    );

    expect(new Set(anchors).size).toBe(anchors.length);
    expect(getFaqAnchorId("general", "delivery-timeline")).toBe(
      "delivery-timeline",
    );
    expect(getFaqAnchorId("timeline", "delivery-timeline")).toBe(
      "timeline-delivery-timeline",
    );
  });
});
