export const metrics = [
  { label: "누적 프로젝트", value: "172건+", note: "2025년 9월 기준" },
  { label: "재의뢰율", value: "47.2%", note: "2025년 9월 기준" },
  { label: "평균 MVP 출시 기간", value: "4주", note: "기능 규모에 따라 변동" },
] as const;

export const categories = ["전체", "MVP", "어플리케이션", "기업 홈페이지"] as const;

export type Category = (typeof categories)[number];

export const portfolioItems = [
  {
    category: "기업 홈페이지",
    description: "인터넷 강의 홈페이지 제작 SaaS",
    duration: "소요기간 3주",
    title: "클래스잇",
  },
  {
    category: "MVP",
    description: "초보 학습자를 위한 투두리스트 제공 플랫폼",
    duration: "소요기간 3주",
    title: "[MVP] 투두몰",
  },
  {
    category: "MVP",
    description: "공기업·사회적기업 채용 및 리뷰 플랫폼",
    duration: "소요기간 3주",
    title: "[MVP] 공:사 모락모락",
  },
  {
    category: "어플리케이션",
    description: "시니어 행사 참여인원 모집 플랫폼",
    duration: "소요기간 3주",
    slug: "meetit-plus",
    title: "[MVP] 믿잇 플러스",
  },
  {
    category: "기업 홈페이지",
    description: "장례 견적 사전 조회 홈페이지",
    duration: "소요기간 3주",
    title: "장례담",
  },
  {
    category: "어플리케이션",
    description: "해외 불법 상품 차단 데이터 CRM",
    duration: "소요기간 3주",
    title: "리팡",
  },
  {
    category: "기업 홈페이지",
    description: "콘텐츠 운영형 기업 웹사이트",
    duration: "소요기간 3주",
    title: "오퍼스하우스",
  },
  {
    category: "MVP",
    description: "로컬 커뮤니티 검증 플랫폼",
    duration: "소요기간 3주",
    title: "[MVP] 마이플랜잇",
  },
  {
    category: "어플리케이션",
    description: "사용자 예약 및 알림 앱",
    duration: "소요기간 3주",
    title: "리라이브딜",
  },
] as const;

export const portfolioDetails = [
  {
    category: "MVP 개발",
    description: "시니어 활동 프로그램 홍보 및 참가자 모집 플랫폼",
    estimate: "298만 원(VAT포함)",
    features: ["활동 등록", "신청·참여", "선착순", "알림톡", "비회원 조회"],
    period: "3주",
    scope: ["기획", "UX/UI 디자인", "웹 개발", "도메인·서버"],
    slug: "meetit-plus",
    title: "믿잇 플러스(CJ제일제당 사내벤처)",
  },
] as const;

export const featuredCase = portfolioDetails[0];
