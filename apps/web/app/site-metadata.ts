import type { Metadata } from "next";

export const SITE_URL = "https://www.zerosourcing.kr";
export const HOME_TITLE = "제로소싱 | MVP·앱·홈페이지 개발 외주 파트너";
export const HOME_DESCRIPTION =
  "MVP 개발 외주 전문 제로소싱. 핵심 기능만 담아 평균 4주 만에 출시·검증합니다. 앱·기업 홈페이지·강의·쇼핑몰까지, 기능별 정찰가로 투명하게. 무료 상담으로 시작하세요.";

type PageMetadataInput = {
  description: string;
  path: string;
  socialImageUrl?: string | null;
  title: string;
};

export function createPageMetadata({
  description,
  path,
  socialImageUrl,
  title,
}: PageMetadataInput): Metadata {
  const url = new URL(path, `${SITE_URL}/`).toString();
  const socialImage = socialImageUrl
    ? {
        url: socialImageUrl,
        alt: title,
      }
    : {
        url: `${SITE_URL}/og_kakao.png`,
        width: 1200,
        height: 800,
        alt: title,
        type: "image/png",
      };

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url,
      siteName: "제로소싱",
      title,
      description,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
  };
}
