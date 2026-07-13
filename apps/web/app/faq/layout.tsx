import { createPageMetadata } from "../site-metadata";

export const metadata = createPageMetadata({
  title: "제로소싱 | 자주 묻는 질문(FAQ)",
  description:
    "제로소싱 자주 묻는 질문. MVP 개발 비용과 견적, 개발 기간, 노코드·AI 개발 방식, 하이브리드 앱, 기업 홈페이지 SEO·GEO, 출시 후 유지보수와 소유권까지 한눈에 정리했습니다.",
  path: "/faq",
});

export default function FaqLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
