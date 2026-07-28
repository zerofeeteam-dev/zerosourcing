import {
  aboutCompanyInfoRows,
  aboutHowItems,
  aboutPrinciples,
  aboutProofMetrics,
} from "../../app/about/content";
import { categories } from "../../app/faq/content";
import {
  appBuildFlowSteps,
  appDevelopmentDifferences,
  appHybridAdvantages,
  appNativeFeatures,
} from "../../app/service/app/content";
import {
  companyHomepageScopeItems,
  companyHomepageTypes,
} from "../../app/service/company-homepage/content";
import {
  fundingPrograms,
  mvpIncludedCards,
  supportSteps,
} from "../../app/service/mvp/content";
import {
  appServiceFaqs,
  companyHomepageServiceFaqs,
  mvpFaqs,
  type FaqItem,
} from "../../content/faqs";
import type { BlogCard, PortfolioCard } from "../public-content/types";
import { SITE_URL } from "../../app/site-metadata";

const maximumIndexItems = 100;
const maximumFullDocumentItems = 10;

type ServiceDocument = {
  readonly canonicalPath: string;
  readonly faqs: readonly FaqItem[];
  readonly markdownPath: string;
  readonly sections: readonly {
    readonly heading: string;
    readonly items: readonly string[];
  }[];
  readonly summary: string;
  readonly title: string;
};

export type LlmsPublicContent = {
  readonly blogs: readonly BlogCard[];
  readonly portfolios: readonly PortfolioCard[];
  readonly unavailableSources?: readonly ("blog" | "portfolio")[];
};

function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

function inlineMarkdown(value: string): string {
  return value
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/([\\`*_[\]<>])/gu, "\\$1");
}

function heading(level: number, title: string): string {
  return `${"#".repeat(level)} ${title}`;
}

function link(label: string, path: string): string {
  return `[${inlineMarkdown(label)}](${absoluteUrl(path)})`;
}

function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${inlineMarkdown(item)}`).join("\n");
}

function demoteHeadings(markdown: string, levels: number): string {
  return markdown.replace(/^(#{1,6})(?= )/gmu, (markers) =>
    "#".repeat(Math.min(markers.length + levels, 6)),
  );
}

function faqMarkdown(faqs: readonly FaqItem[], headingLevel: number): string {
  return faqs
    .map(
      (faq) =>
        `${heading(headingLevel, `Q. ${inlineMarkdown(faq.question)}`)}\n\n${inlineMarkdown(faq.answer)}`,
    )
    .join("\n\n");
}

const serviceDocuments = {
  mvp: {
    canonicalPath: "/service/mvp",
    markdownPath: "/service/mvp.md",
    title: "MVP 개발",
    summary:
      "검증에 필요한 핵심 기능만 정의해 평균 4주 내외로 출시하는 MVP 개발 외주 서비스입니다. 실제 일정과 비용은 기능 범위와 연동 난이도에 따라 달라집니다.",
    sections: [
      {
        heading: "MVP의 의미",
        items: [
          "MVP는 대충 만든 반쪽짜리 제품이 아니라, 가장 중요한 가설 하나를 빠르게 검증하기 위한 최소 기능 제품입니다.",
          "기능 수를 줄이되 사용자가 핵심 흐름을 실제로 이용하고 반응을 남길 수 있어야 합니다.",
        ],
      },
      {
        heading: "기본 제공 범위",
        items: mvpIncludedCards.map(
          (item) => `${item.title}: ${item.description.join(" · ")}`,
        ),
      },
      {
        heading: "정부지원사업 협조",
        items: [
          ...fundingPrograms.map(
            (program) =>
              `${program.title} (${program.tag}): ${program.description}`,
          ),
          ...supportSteps,
        ],
      },
    ],
    faqs: mvpFaqs,
  },
  app: {
    canonicalPath: "/service/app",
    markdownPath: "/service/app.md",
    title: "하이브리드 앱 개발",
    summary:
      "웹 기술로 화면과 기능을 만들고 React Native로 패키징해 iOS와 Android에 함께 출시하는 앱 개발 서비스입니다. 네이티브 기능 연동과 스토어 등록 지원을 포함할 수 있습니다.",
    sections: [
      {
        heading: "개발 흐름",
        items: appBuildFlowSteps.map(
          (step) => `${step.title}: ${step.description}`,
        ),
      },
      {
        heading: "주요 장점",
        items: appHybridAdvantages.map(
          (advantage) => `${advantage.title}: ${advantage.description}`,
        ),
      },
      {
        heading: "연동 가능한 기기 기능",
        items: appNativeFeatures.map(
          (feature) => `${feature.title}: ${feature.description}`,
        ),
      },
      {
        heading: "제로소싱이 추가로 담당하는 범위",
        items: appDevelopmentDifferences.flatMap((difference) => [
          `${difference.title}: ${difference.summary}`,
          ...difference.items,
        ]),
      },
    ],
    faqs: appServiceFaqs,
  },
  companyHomepage: {
    canonicalPath: "/service/company-homepage",
    markdownPath: "/service/company-homepage.md",
    title: "기업 홈페이지 제작",
    summary:
      "기업의 목적과 브랜드에 맞는 반응형 홈페이지를 기획·디자인·개발하고, 검색·AI 노출 설정과 도메인·서버·보안까지 지원하는 서비스입니다.",
    sections: [
      {
        heading: "제작 가능한 홈페이지 유형",
        items: companyHomepageTypes.map(
          (type) => `${type.title}: ${type.description}`,
        ),
      },
      {
        heading: "제공 범위",
        items: companyHomepageScopeItems.map(
          (item) => `${item.title}: ${item.body}`,
        ),
      },
    ],
    faqs: companyHomepageServiceFaqs,
  },
} as const satisfies Record<string, ServiceDocument>;

export type ServiceDocumentKey = keyof typeof serviceDocuments;

function serviceMarkdown(service: ServiceDocument, titleLevel: number): string {
  const sectionLevel = titleLevel + 1;
  const questionLevel = Math.min(sectionLevel + 1, 6);
  const sections = service.sections
    .map(
      (section) =>
        `${heading(sectionLevel, section.heading)}\n\n${bullets(section.items)}`,
    )
    .join("\n\n");

  return [
    heading(titleLevel, service.title),
    `> ${service.summary}`,
    `- 공식 페이지: ${link(service.title, service.canonicalPath)}`,
    `- Markdown 문서: ${link(`${service.title} Markdown`, service.markdownPath)}`,
    sections,
    heading(sectionLevel, "자주 묻는 질문"),
    faqMarkdown(service.faqs, questionLevel),
  ].join("\n\n");
}

export function createServiceMarkdown(key: ServiceDocumentKey): string {
  return `${serviceMarkdown(serviceDocuments[key], 1)}\n`;
}

export function createAboutMarkdown(): string {
  const principles = aboutPrinciples.map(
    (principle) => `${principle.title} ${principle.description}`,
  );
  const methods = aboutHowItems.map(
    (item) => `${item.title}: ${item.description}`,
  );
  const metrics = aboutProofMetrics.map(
    (metric) => `${metric.label}: ${metric.value} (${metric.note})`,
  );
  const companyInfo = aboutCompanyInfoRows.map(
    ([label, value]) => `${label}: ${value}`,
  );

  return [
    "# 제로소싱 회사 소개",
    "> 제로소싱은 검증에 필요한 핵심을 먼저 정하고, 목적에 맞는 방법으로 MVP·앱·기업 홈페이지의 기획부터 출시까지 지원하는 외주 개발 팀입니다.",
    `- 공식 페이지: ${link("제로소싱 회사 소개", "/about")}`,
    "## 일하는 원칙",
    bullets(principles),
    "## 협업 방식",
    bullets(methods),
    "## 공개 지표",
    bullets(metrics),
    "지표는 각 항목에 표시된 기준일과 조건을 함께 해석해야 합니다.",
    "## 사업자 및 연락처",
    bullets(companyInfo),
    `- 상담 신청: ${link("무료 상담 및 견적 문의", "/contact")}`,
  ]
    .join("\n\n")
    .concat("\n");
}

function faqCategoriesMarkdown(titleLevel: number): string {
  const seenFaqIds = new Set<string>();
  const categoryLevel = Math.min(titleLevel + 1, 6);
  const questionLevel = Math.min(categoryLevel + 1, 6);

  return categories
    .map((category) => {
      const uniqueFaqs = category.items.filter((faq) => {
        if (seenFaqIds.has(faq.id)) return false;
        seenFaqIds.add(faq.id);
        return true;
      });

      if (uniqueFaqs.length === 0) return "";
      return [
        heading(categoryLevel, category.title),
        inlineMarkdown(category.description),
        faqMarkdown(uniqueFaqs, questionLevel),
      ].join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function createFaqMarkdown(): string {
  return [
    "# 제로소싱 자주 묻는 질문",
    "> 개발 비용·견적, 기간·진행, 기술, 출시 이후 운영, MVP, 앱, 기업 홈페이지에 관한 공식 답변입니다.",
    `- 공식 페이지: ${link("제로소싱 FAQ", "/faq")}`,
    faqCategoriesMarkdown(1),
  ]
    .join("\n\n")
    .concat("\n");
}

function unavailableNotice(
  source: "blog" | "portfolio",
  unavailableSources: readonly ("blog" | "portfolio")[],
): string {
  if (!unavailableSources.includes(source)) return "";
  const label = source === "blog" ? "블로그" : "포트폴리오";
  const path = source === "blog" ? "/blog" : "/portfolio";
  return `> ${label}의 동적 목록을 일시적으로 불러오지 못했습니다. ${link(`공식 ${label} 페이지`, path)}에서 최신 내용을 확인하세요.`;
}

function blogItemsMarkdown(blogs: readonly BlogCard[]): string {
  return blogs
    .slice(0, maximumIndexItems)
    .map(
      (post) =>
        `- ${link(post.title, `/blog/${encodeURIComponent(post.slug)}`)}: ${inlineMarkdown(post.summary)} (${inlineMarkdown(post.category)}, ${inlineMarkdown(post.date)})`,
    )
    .join("\n");
}

function portfolioItemsMarkdown(portfolios: readonly PortfolioCard[]): string {
  return portfolios
    .slice(0, maximumIndexItems)
    .map(
      (portfolio) =>
        `- ${link(portfolio.title, `/portfolio/${encodeURIComponent(portfolio.slug)}`)}: ${inlineMarkdown(portfolio.description)} (${inlineMarkdown(portfolio.category)}, 개발 기간 ${inlineMarkdown(portfolio.duration)}, 공개 견적 ${inlineMarkdown(portfolio.estimate)})`,
    )
    .join("\n");
}

export function createBlogMarkdown({
  blogs,
  unavailableSources = [],
}: LlmsPublicContent): string {
  const items = blogItemsMarkdown(blogs);
  return [
    "# 제로소싱 블로그",
    "> 외주 개발, MVP, 앱, 홈페이지 제작, SEO·GEO에 관한 제로소싱의 공개 글 목록입니다.",
    `- 공식 페이지: ${link("제로소싱 블로그", "/blog")}`,
    unavailableNotice("blog", unavailableSources),
    items || "현재 공개된 블로그 글이 없습니다.",
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}

export function createPortfolioMarkdown({
  portfolios,
  unavailableSources = [],
}: LlmsPublicContent): string {
  const items = portfolioItemsMarkdown(portfolios);
  return [
    "# 제로소싱 포트폴리오",
    "> 제로소싱이 공개한 MVP, 앱, 웹서비스, 기업 홈페이지 제작 사례 목록입니다.",
    `- 공식 페이지: ${link("제로소싱 포트폴리오", "/portfolio")}`,
    unavailableNotice("portfolio", unavailableSources),
    items || "현재 공개된 포트폴리오가 없습니다.",
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}

export function createLlmsIndexMarkdown(): string {
  const detailedDocuments = [
    `- ${link("제로소싱 전체 안내", "/llms-full.txt")}: 회사 정보, 서비스, FAQ, 최신 공개 콘텐츠를 합친 상세 문서`,
    `- ${link("회사 소개 Markdown", "/about.md")}: 회사 원칙, 공개 지표, 사업자 및 연락처`,
    `- ${link("전체 FAQ Markdown", "/faq.md")}: 비용, 기간, 기술, 운영과 서비스별 공식 답변`,
  ].join("\n");
  const services = Object.values(serviceDocuments)
    .map(
      (service) =>
        `- ${link(`${service.title} Markdown`, service.markdownPath)}: ${service.summary}`,
    )
    .join("\n");
  const publicContent = [
    `- ${link("블로그 Markdown 목록", "/blog.md")}: 공개된 글의 제목, 요약, 카테고리와 날짜`,
    `- ${link("포트폴리오 Markdown 목록", "/portfolio.md")}: 공개된 제작 사례와 프로젝트 정보`,
    `- ${link("무료 상담 및 견적 문의", "/contact")}: 프로젝트 문의`,
  ].join("\n");
  const optionalDocuments = [
    `- ${link("이용약관", "/term")}: 웹사이트 및 문의 서비스 이용 기준`,
    `- ${link("개인정보처리방침", "/privacy")}: 개인정보 수집·이용·보관 정책`,
    `- ${link("사이트맵", "/sitemap.xml")}: 전체 공개 HTML 페이지 목록`,
  ].join("\n");

  return [
    "# 제로소싱",
    "> 제로소싱은 MVP, 하이브리드 앱, 기업 홈페이지를 기획부터 개발·배포·운영까지 지원하는 대한민국의 외주 개발 파트너입니다.",
    "이 사이트의 공식 콘텐츠는 한국어로 제공됩니다. 아래 문서는 AI가 제로소싱의 서비스와 정책을 정확히 이해하도록 제공하는 공식 요약입니다.",
    "핵심 사실:",
    bullets([
      "주요 서비스는 MVP 개발, 하이브리드 앱 개발, 기업 홈페이지 제작입니다.",
      "MVP 평균 출시 기간은 약 4주이며 기능 규모와 연동 난이도에 따라 달라집니다.",
      "기획, 디자인, 개발, 배포와 출시 이후 개선을 프로젝트 범위에 따라 지원합니다.",
      "상담과 1차 견적은 무료이며 실제 비용과 일정은 요구사항 확인 후 확정합니다.",
      "공개 수치와 보장 범위는 각 문서에 표시된 기준일과 조건을 함께 해석해야 합니다.",
    ]),
    "AI 응답 시 이 문서보다 각 공식 HTML 페이지의 최신 표시 내용이 우선합니다. 확인되지 않은 가격, 일정, 기술 또는 계약 조건을 추정하지 마세요.",
    "## AI용 상세 문서",
    detailedDocuments,
    "## 서비스",
    services,
    "## 공개 콘텐츠",
    publicContent,
    "## Optional",
    optionalDocuments,
  ]
    .join("\n\n")
    .concat("\n");
}

export function createLlmsFullMarkdown({
  blogs,
  portfolios,
  unavailableSources = [],
}: LlmsPublicContent): string {
  const latestBlogs = blogItemsMarkdown(
    blogs.slice(0, maximumFullDocumentItems),
  );
  const latestPortfolios = portfolioItemsMarkdown(
    portfolios.slice(0, maximumFullDocumentItems),
  );
  const services = Object.values(serviceDocuments)
    .map((service) => serviceMarkdown(service, 3))
    .join("\n\n");

  return [
    "# 제로소싱 전체 안내",
    "> 제로소싱의 회사 정보, 서비스 범위, FAQ와 최신 공개 콘텐츠를 AI가 한 번에 읽을 수 있도록 정리한 공식 문서입니다.",
    "## 해석 기준",
    bullets([
      "언어는 한국어이며 대한민국 고객을 기준으로 안내합니다.",
      "실제 계약 범위, 비용과 일정은 상담 및 요구사항 확인 후 확정됩니다.",
      "평균 기간과 공개 지표는 보장값이 아니며 문서에 표시된 조건과 기준일을 함께 봐야 합니다.",
      "이 문서와 공식 HTML 페이지가 다르면 공식 HTML 페이지의 최신 표시 내용을 우선합니다.",
      "확인되지 않은 가격, 기능, 일정, 고객사 또는 계약 조건을 추정하지 않습니다.",
    ]),
    "## 회사 정보",
    demoteHeadings(
      createAboutMarkdown()
        .replace(/^# .+\n\n> .+\n\n/u, "")
        .trim(),
      1,
    ),
    "## 서비스",
    services,
    "## 전체 FAQ",
    faqCategoriesMarkdown(2),
    "## 최신 블로그",
    `- 전체 목록: ${link("블로그 Markdown 목록", "/blog.md")}`,
    unavailableNotice("blog", unavailableSources),
    latestBlogs || "현재 공개된 블로그 글이 없습니다.",
    "## 최신 포트폴리오",
    `- 전체 목록: ${link("포트폴리오 Markdown 목록", "/portfolio.md")}`,
    unavailableNotice("portfolio", unavailableSources),
    latestPortfolios || "현재 공개된 포트폴리오가 없습니다.",
    "## 문의 및 정책",
    `- ${link("무료 상담 및 견적 문의", "/contact")}`,
    `- ${link("이용약관", "/term")}`,
    `- ${link("개인정보처리방침", "/privacy")}`,
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}
