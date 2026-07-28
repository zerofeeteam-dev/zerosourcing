import type { IconName } from "../../components/Icon";
import {
  afterLaunchFaqs,
  appFaqs,
  commonFaqs,
  companyHomepageFaqs,
  mvpFaqs,
  pricingFaqs,
  techFaqs,
  timelineFaqs,
  type FaqId,
  type FaqItem,
} from "../../content/faqs";

export type FaqCategory = {
  description: string;
  icon: IconName;
  id: string;
  items: readonly FaqItem[];
  title: string;
};

export type FaqCategoryNavItem = {
  icon: IconName;
  id: string;
  title: string;
};

export type FaqCategoryNavGroup = {
  items: readonly FaqCategoryNavItem[];
  title: string;
};

export const categories = [
  {
    description: "제로소싱과 서비스에 대한 기본적인 질문",
    icon: "help-circle-contained",
    id: "general",
    items: commonFaqs,
    title: "일반",
  },
  {
    description: "개발 비용과 견적 산정에 대한 질문",
    icon: "currency-coin-dollar",
    id: "pricing",
    items: pricingFaqs,
    title: "비용·견적",
  },
  {
    description: "개발 기간과 진행 절차에 대한 질문",
    icon: "calendar-02",
    id: "timeline",
    items: timelineFaqs,
    title: "기간·진행",
  },
  {
    description: "개발 방식과 기술 선택에 대한 질문",
    icon: "wrench",
    id: "tech",
    items: techFaqs,
    title: "개발·기술",
  },
  {
    description: "출시 이후 운영과 개선에 대한 질문",
    icon: "loader-01",
    id: "after-launch",
    items: afterLaunchFaqs,
    title: "출시 이후",
  },
  {
    description: "MVP 개발에 대해 자주 묻는 질문",
    icon: "package-02",
    id: "mvp",
    items: mvpFaqs,
    title: "MVP 개발",
  },
  {
    description: "하이브리드 앱 개발에 대해 자주 묻는 질문",
    icon: "component",
    id: "app",
    items: appFaqs,
    title: "앱 개발",
  },
  {
    description: "기업 홈페이지 제작에 대해 자주 묻는 질문",
    icon: "home-02",
    id: "company-homepage",
    items: companyHomepageFaqs,
    title: "기업 홈페이지",
  },
] as const satisfies readonly FaqCategory[];

export const navGroups = [
  {
    title: "공통",
    items: categories.slice(0, 5),
  },
  {
    title: "서비스별",
    items: categories.slice(5),
  },
] as const satisfies readonly FaqCategoryNavGroup[];

export function getFaqAnchorId(categoryId: string, faqId: FaqId): string {
  return categoryId === "timeline" && faqId === "delivery-timeline"
    ? "timeline-delivery-timeline"
    : faqId;
}
