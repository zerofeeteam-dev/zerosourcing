import { createPageMetadata } from "../site-metadata";

export const metadata = createPageMetadata({
  title: "제로소싱 포트폴리오 | MVP·앱·홈페이지 제작 사례",
  description:
    "제로소싱 포트폴리오. MVP·하이브리드 앱·기업 홈페이지·인터넷 강의·온라인 쇼핑몰까지, 견적·기간·기능 등 실제 제작 사례를 확인하세요. 빠르게 검증하고 출시한 프로젝트를 모았습니다.",
  path: "/portfolio",
});

export default function PortfolioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
