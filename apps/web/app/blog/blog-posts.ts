export type BlogPost = {
  author: string;
  category: string;
  contentHtml: string;
  date: string;
  description: string;
  isNew?: boolean;
  relatedSlugs: string[];
  slug: string;
  title: string;
};

export const blogPosts: BlogPost[] = [
  {
    author: "제로소싱",
    category: "가이드",
    contentHtml: "<p>HTML</p>",
    date: "2026. 11. 02",
    description:
      '"MVP 하나에 얼마예요?"라는 질문에는 사실 정해진 답이 없습니다. 대신, 비용이 어떻게 결정되는지를 알면 합리적인 예산을 스스로 가늠할 수 있습니다.',
    relatedSlugs: [
      "company-homepage-search",
      "nocode-vs-custom-development",
      "company-homepage-search",
    ],
    slug: "mvp-development-cost",
    title: "MVP 개발 비용, 얼마가 적정할까?",
  },
  {
    author: "제로소싱",
    category: "인사이트",
    contentHtml: "<p>HTML</p>",
    date: "2026. 11. 02",
    description:
      "우리 서비스엔 어떤 방식이 맞을까요? 개발 비용과 기간, 성능, 앞으로의 확장성까지 두 방식의 차이를 항목별로 비교했습니다. 결론부터 말하면, 정답은 서비스의 성격에 따라 달라집니다.",
    isNew: true,
    relatedSlugs: ["mvp-with-government-support", "outsourcing-fail-patterns"],
    slug: "hybrid-vs-native-app",
    title: "하이브리드 앱 vs 네이티브 앱, 무엇을 고를까",
  },
  {
    author: "제로소싱",
    category: "인사이트",
    contentHtml: "<p>HTML</p>",
    date: "2026. 11. 02",
    description:
      "예비창업패키지와 초기창업패키지 같은 지원사업의 사업화 자금으로 MVP 개발비를 충당할 수 있습니다. 어떤 사업이 MVP 제작에 적합한지 정리했습니다.",
    isNew: true,
    relatedSlugs: ["mvp-development-cost", "nocode-vs-custom-development"],
    slug: "mvp-with-government-support",
    title: "정부지원사업으로 MVP 만드는 법",
  },
  {
    author: "제로소싱",
    category: "인사이트",
    contentHtml: "<p>HTML</p>",
    date: "2026. 11. 02",
    description:
      "맡기고 나서 후회하는 데는 이유가 있습니다. 견적만 보고 결정하거나, 요구사항을 끝까지 미루거나, 실패한 프로젝트에서 반복되는 신호를 짚어봅니다.",
    isNew: true,
    relatedSlugs: ["mvp-development-cost", "company-homepage-search"],
    slug: "outsourcing-fail-patterns",
    title: "외주 개발에 실패하는 회사들의 공통점",
  },
  {
    author: "제로소싱",
    category: "인사이트",
    contentHtml: "<p>HTML</p>",
    date: "2026. 11. 02",
    description:
      "디자인이 예뻐도 검색에 안 나오면 아무도 못 찾습니다. 많은 기업 홈페이지가 놓치는 SEO의 기본부터, 요즘 더 중요해진 AI 검색(GEO)까지 노출되지 않는 진짜 원인과 해결법을 담았습니다.",
    relatedSlugs: ["nocode-vs-custom-development", "mvp-development-cost"],
    slug: "company-homepage-search",
    title: "기업 홈페이지가 검색에 안 잡히는 진짜 이유",
  },
  {
    author: "제로소싱",
    category: "인사이트",
    contentHtml: "<p>HTML</p>",
    date: "2026. 11. 02",
    description:
      "빠르게 검증하려면 노코드가, 독창적인 로직이나 자산화가 필요하면 정통 개발이 유리합니다. 검증 단계와 목표에 따라 어떤 선택이 합리적인지 비교했습니다.",
    relatedSlugs: ["company-homepage-search", "mvp-development-cost"],
    slug: "nocode-vs-custom-development",
    title: "노코드로 시작할까, 정통 개발로 갈까",
  },
];

const bySlug = (slug: string) => blogPosts.find((post) => post.slug === slug)!;

export const featuredBlogPost = bySlug("hybrid-vs-native-app");
export const topBlogPosts = [
  bySlug("hybrid-vs-native-app"),
  bySlug("mvp-with-government-support"),
  bySlug("outsourcing-fail-patterns"),
];
export const blogListPosts = [
  bySlug("company-homepage-search"),
  bySlug("nocode-vs-custom-development"),
  bySlug("company-homepage-search"),
  bySlug("nocode-vs-custom-development"),
  bySlug("company-homepage-search"),
  bySlug("nocode-vs-custom-development"),
];
