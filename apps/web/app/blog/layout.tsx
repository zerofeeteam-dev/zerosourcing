import { createPageMetadata } from "../site-metadata";

export const metadata = createPageMetadata({
  title: "제로소싱 블로그 | MVP·외주 개발 인사이트",
  description:
    "제로소싱 블로그에서 MVP 개발과 외주 개발을 더 잘하는 법을 나눕니다. 견적·비용 가이드부터 앱 개발, SEO·GEO, 정부지원사업 활용까지 현장에서 얻은 인사이트를 전합니다.",
  path: "/blog",
});

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
