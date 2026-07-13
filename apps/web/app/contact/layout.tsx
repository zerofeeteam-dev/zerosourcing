import { createPageMetadata } from "../site-metadata";

export const metadata = createPageMetadata({
  title: "제로소싱 | 문의접수",
  description:
    "제로소싱에 MVP·앱·홈페이지 개발을 문의하세요. 아이디어만 있어도 괜찮습니다. 남겨주시면 영업일 기준 하루 안에 연락드리고, 상담과 견적은 무료입니다. 기능별 정찰가로 투명하게 안내합니다.",
  path: "/contact",
});

export default function ContactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
