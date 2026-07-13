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

export const companyHomepageFaqs = [
  {
    question: "기업 홈페이지 제작 기간과 비용은 어떻게 되나요?",
    answer:
      "페이지 수, 디자인 범위, CMS 적용 여부에 따라 달라집니다. 상담에서 필요한 화면과 기능을 먼저 정리한 뒤 기간과 비용을 안내드립니다.",
  },
  {
    question: "홈페이지를 만든 뒤 내용 수정은 직접 할 수 있나요?",
    answer:
      "네. 글과 이미지를 직접 바꿀 수 있는 콘텐츠 관리 기능(CMS)을 기본 제공합니다. 공지·소식·회사 정보를 바꿀 때마다 외주를 부를 필요가 없습니다.",
  },
  {
    question: "네이버·구글 검색에 잘 나오게 해주나요?",
    answer:
      "네. 메타태그, 사이트맵, 구조화 데이터, 페이지 속도처럼 기본 SEO 세팅을 함께 적용해 검색엔진이 페이지를 이해하기 쉽게 만듭니다.",
  },
  {
    question: "AI 검색(ChatGPT·Claude)에도 노출되나요?",
    answer:
      "회사와 서비스 정보를 구조화해 AI가 인용하기 쉬운 형태로 정리합니다. 검색엔진 최적화와 함께 생성형 AI 답변 노출까지 고려합니다.",
  },
  {
    question: "모바일에서도 잘 보이나요?",
    answer:
      "네. PC, 태블릿, 모바일 화면에 맞춰 반응형으로 제작해 어떤 기기에서도 단정하게 보이도록 구성합니다.",
  },
  {
    question: "도메인과 서버도 맡아 주나요?",
    answer:
      "네. 도메인 연결, 서버 배포, SSL 보안 설정까지 함께 진행할 수 있습니다. 운영 방식은 고객님 계정 기준으로 정리합니다.",
  },
] as const;
