import type { IconName } from "../../../components/Icon";

export const companyHomepageTypes = [
  {
    description: "회사·연혁·사업을 신뢰감 있게 전달.",
    iconName: "company-building-01",
    title: "회사 소개형",
  },
  {
    description: "비주얼 중심으로 브랜드 인상을 강하게.",
    iconName: "company-pen-tool-03",
    title: "브랜드형",
  },
  {
    description: "제품·서비스를 보기 쉽게 정리해 문의로 연결.",
    iconName: "company-package-02",
    title: "제품·서비스 소개형",
  },
  {
    description: "인재에게 회사의 매력과 비전을 전달.",
    iconName: "company-user",
    title: "채용 홈페이지",
  },
  {
    description: "한 페이지로 전환에 집중하는 캠페인용.",
    iconName: "company-stars",
    title: "랜딩페이지",
  },
  {
    description: "낡은 홈페이지를 최신 반응형으로 새단장.",
    iconName: "company-home-02",
    title: "홈페이지 리뉴얼",
  },
] as const satisfies readonly {
  description: string;
  iconName: IconName;
  title: string;
}[];

export const companyHomepageScopeItems = [
  {
    body: "PC·태블릿·모바일 어디서든 단정하게 보이도록.",
    eyebrow: "RESPONSIVE",
    title: "반응형 제작",
  },
  {
    body: "만들고 끝이 아니라, 검색과 AI 답변에 잡히게.",
    eyebrow: "SEO·GEO",
    title: "검색·AI 노출 세팅",
  },
  {
    body: "방문자가 바로 연락할 수 있는 문의 창구.",
    eyebrow: "FORM",
    title: "문의·상담 폼",
  },
  {
    body: "글·이미지·공지를 외주 없이 직접 관리.",
    eyebrow: "CMS",
    title: "콘텐츠 직접 수정",
  },
  {
    body: "도메인 연결, 서버 운영, SSL 보안까지.",
    eyebrow: "INFRA",
    title: "도메인·서버·보안",
  },
] as const;
