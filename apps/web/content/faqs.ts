export type FaqRecord = {
  readonly answer: string;
  readonly id: string;
  readonly question: string;
};

export const faqById = {
  "mvp-development-cost": {
    id: "mvp-development-cost",
    question: "MVP 개발 비용은 얼마나 드나요?",
    answer:
      "기능 범위와 연동 난이도에 따라 달라집니다. 상담에서 꼭 필요한 기능을 먼저 정리한 뒤, 불필요한 범위는 덜어내고 견적을 투명하게 안내드립니다.",
  },
  "delivery-timeline": {
    id: "delivery-timeline",
    question: "개발 기간은 보통 얼마나 걸리나요?",
    answer:
      "제로소싱의 MVP 개발 기간은 평균 4주 내외입니다. 풀스펙으로 6개월씩 끄는 대신, 검증에 꼭 필요한 핵심 기능만 담아 빠르게 출시합니다. 상담에서 기능 범위를 확정한 뒤 정확한 일정을 약속드리고, 진행 중 변동이 생기면 즉시 공유합니다.",
  },
  "outsourcing-estimate-variation": {
    id: "outsourcing-estimate-variation",
    question: "외주 개발 견적이 업체마다 천차만별인 이유는 뭔가요?",
    answer:
      "기획 범위, 포함 기능, 디자인 완성도, 서버·결제·운영 범위가 업체마다 다르게 계산되기 때문입니다. 제로소싱은 견적 기준이 되는 요구사항부터 먼저 정리합니다.",
  },
  "planning-without-spec": {
    id: "planning-without-spec",
    question: "기획이 없어도 MVP 개발을 의뢰할 수 있나요?",
    answer:
      "가능합니다. 아이디어 단계라면 서비스 기획, 기능 우선순위, 사용자 흐름부터 함께 정리한 뒤 개발 범위를 확정합니다.",
  },
  "source-code-and-ownership": {
    id: "source-code-and-ownership",
    question: "소스코드와 결과물의 소유권은 모두 넘겨받나요?",
    answer:
      "계약 범위에 포함된 결과물과 소스코드는 납품 시 전달드립니다. 배포 계정, 도메인, 서버 등 운영에 필요한 항목도 고객님 명의 기준으로 정리합니다.",
  },
  "mvp-post-launch-support": {
    id: "mvp-post-launch-support",
    question: "MVP 출시 후 추가 개발과 유지보수도 가능한가요?",
    answer:
      "가능합니다. 직접 개발한 코드의 버그는 계속 대응하고, 출시 후 데이터와 고객 반응을 기준으로 다음 기능 개발도 이어갈 수 있습니다.",
  },
  "nocode-vs-custom-development": {
    id: "nocode-vs-custom-development",
    question: "노코드와 외주 개발, 어떤 게 우리 MVP에 맞을까요?",
    answer:
      "검증 속도가 가장 중요하고 기능이 단순하면 노코드가 맞을 수 있습니다. 결제, 권한, 데이터 구조, 확장성이 중요하다면 처음부터 개발로 가는 편이 안전합니다.",
  },
  "consultation-and-estimate-free": {
    id: "consultation-and-estimate-free",
    question: "상담과 견적은 무료인가요?",
    answer:
      "네. 상담과 1차 견적은 무료입니다. 아이디어만 있어도 현재 단계에서 필요한 범위와 예산을 함께 정리해드립니다.",
  },
  "estimate-scope": {
    id: "estimate-scope",
    question: "견적은 어떤 기준으로 산정되나요?",
    answer:
      "화면 수, 핵심 기능, 외부 연동, 관리자 기능, 배포 범위를 기준으로 산정합니다. 먼저 검증에 꼭 필요한 범위를 줄이는 것부터 제안합니다.",
  },
  "small-budget-mvp": {
    id: "small-budget-mvp",
    question: "예산이 작아도 의뢰할 수 있나요?",
    answer:
      "가능합니다. 예산 안에서 가능한 검증 범위를 먼저 잡고, 다음 단계로 미룰 기능을 구분해드립니다.",
  },
  "government-funding-development": {
    id: "government-funding-development",
    question: "정부지원금으로 개발비를 낼 수 있나요?",
    answer:
      "가능합니다. 지원사업 요구에 맞춰 견적서, 계약서, 증빙 서류 협조가 필요한 경우 진행 단계에 맞춰 도와드립니다.",
  },
  "additional-costs": {
    id: "additional-costs",
    question: "추가 비용은 언제 발생하나요?",
    answer:
      "계약 범위에 없는 기능 추가, 외부 서비스 정책 변경, 스토어 심사 대응처럼 범위가 바뀌는 경우 사전에 공유하고 진행합니다.",
  },
  "delivery-progress-sharing": {
    id: "delivery-progress-sharing",
    question: "진행 과정은 어떻게 공유되나요?",
    answer:
      "기획 범위 확정 후 디자인, 개발, 중간 점검, 배포 순서로 진행합니다. 진행 중 변경이나 리스크가 생기면 바로 공유합니다.",
  },
  "scope-change": {
    id: "scope-change",
    question: "중간에 기능을 바꿀 수 있나요?",
    answer:
      "가능합니다. 다만 일정과 견적에 영향이 있는 변경은 범위를 다시 정리한 뒤 진행합니다.",
  },
  "expedited-launch": {
    id: "expedited-launch",
    question: "빠르게 출시해야 하는 경우도 가능한가요?",
    answer:
      "가능합니다. 이 경우 검증에 필요한 핵심 흐름만 남기고 출시 이후 기능을 분리하는 방식으로 일정을 줄입니다.",
  },
  "deployment-support": {
    id: "deployment-support",
    question: "배포까지 맡아 주나요?",
    answer:
      "네. 도메인 연결, 서버 배포, SSL 설정, 앱 스토어 등록처럼 출시 과정에 필요한 작업을 함께 진행할 수 있습니다.",
  },
  "technology-selection": {
    id: "technology-selection",
    question: "어떤 기술로 개발하나요?",
    answer:
      "서비스 목적에 따라 웹, 하이브리드 앱, 관리자, 서버 구성을 선택합니다. 유지보수와 확장을 고려해 과한 기술보다 운영 가능한 구조를 우선합니다.",
  },
  "common-integrations": {
    id: "common-integrations",
    question: "결제, 로그인, 알림 같은 기능도 가능한가요?",
    answer:
      "가능합니다. 결제, 소셜 로그인, 파일 업로드, 알림톡, 푸시 알림처럼 자주 쓰는 기능은 정책과 범위를 확인한 뒤 구현합니다.",
  },
  "source-code-delivery": {
    id: "source-code-delivery",
    question: "소스코드는 받을 수 있나요?",
    answer:
      "계약 범위에 포함된 결과물과 소스코드는 납품 시 전달드립니다. 운영 계정도 고객님 명의 기준으로 정리합니다.",
  },
  "existing-service-enhancement": {
    id: "existing-service-enhancement",
    question: "기존 서비스에 기능을 추가할 수도 있나요?",
    answer:
      "가능합니다. 기존 코드와 운영 환경을 먼저 확인한 뒤, 수정 가능한 범위와 리스크를 안내드립니다.",
  },
  "nocode-to-custom-migration": {
    id: "nocode-to-custom-migration",
    question: "노코드로 만든 서비스를 개발로 전환할 수 있나요?",
    answer:
      "가능합니다. 기존 데이터 구조와 사용자 흐름을 확인하고, 유지할 부분과 새로 만들어야 할 부분을 나눠 진행합니다.",
  },
  "post-launch-maintenance": {
    id: "post-launch-maintenance",
    question: "출시 후 유지보수도 가능한가요?",
    answer:
      "가능합니다. 직접 개발한 코드의 버그는 계속 대응하고, 운영 중 필요한 개선도 범위를 정해 이어갈 수 있습니다.",
  },
  "post-launch-feature-prioritization": {
    id: "post-launch-feature-prioritization",
    question: "출시 후 기능 추가는 어떻게 진행하나요?",
    answer:
      "사용자 반응과 데이터를 기준으로 다음 기능의 우선순위를 정합니다. 작은 단위로 나눠 빠르게 반영하는 방식을 권장합니다.",
  },
  "incident-response": {
    id: "incident-response",
    question: "운영 중 문제가 생기면 대응해 주나요?",
    answer:
      "네. 장애나 정책 변경처럼 운영에 영향을 주는 이슈는 우선순위를 높여 확인합니다.",
  },
  "admin-page-inclusion": {
    id: "admin-page-inclusion",
    question: "관리자 페이지도 포함되나요?",
    answer:
      "필요한 경우 포함합니다. 콘텐츠 관리, 신청 내역 확인, 회원 관리처럼 운영에 꼭 필요한 기능을 기준으로 설계합니다.",
  },
  "search-and-ai-discoverability": {
    id: "search-and-ai-discoverability",
    question: "검색 노출이나 AI 검색도 고려하나요?",
    answer:
      "네. 홈페이지와 공개 페이지는 기본 SEO, 구조화 데이터, 사이트맵 등을 함께 고려합니다.",
  },
  "mvp-feature-scope": {
    id: "mvp-feature-scope",
    question: "MVP에 기능은 보통 몇 개나 넣나요?",
    answer:
      "보통 1~3개의 핵심 기능만 넣습니다. 회원가입, 결제, 관리자처럼 검증에 꼭 필요한 기능을 먼저 정하고, 있어도 없어도 되는 기능은 다음 단계로 미룹니다.",
  },
  "mvp-expansion": {
    id: "mvp-expansion",
    question: "MVP만 만들고 끝나면, 나중에 확장은 어떻게 하나요?",
    answer:
      "처음부터 확장 가능한 구조를 염두에 두고 개발합니다. 검증 후 사용자 반응과 데이터를 기준으로 기능을 추가하거나 정식 서비스로 고도화할 수 있습니다.",
  },
  "mvp-design-quality": {
    id: "mvp-design-quality",
    question: "MVP라서 디자인 완성도는 떨어지나요?",
    answer:
      "검증에 필요한 화면은 실제 서비스처럼 사용할 수 있게 만듭니다. 과한 장식보다 핵심 흐름, 신뢰감, 사용성을 우선해 MVP 단계에 맞는 완성도로 정리합니다.",
  },
  "mvp-investment-or-funding": {
    id: "mvp-investment-or-funding",
    question: "MVP 결과물로 투자 유치나 정부지원사업에 활용할 수 있나요?",
    answer:
      "가능합니다. 데모, 중간점검, 발표에서 보여줄 수 있는 작동형 결과물과 화면 흐름을 목표에 맞춰 준비합니다.",
  },
  "government-funding-mvp": {
    id: "government-funding-mvp",
    question: "정부지원금으로 MVP 개발비를 낼 수 있나요?",
    answer:
      "가능합니다. 지원사업 요구에 맞춰 견적서, 계약서, 증빙 서류 협조가 필요한 경우 진행 단계에 맞춰 도와드립니다.",
  },
  "hybrid-vs-native": {
    id: "hybrid-vs-native",
    question: "웹뷰 하이브리드 앱은 네이티브 앱과 뭐가 다른가요?",
    answer:
      "웹 기술로 화면과 기능을 만들고 React Native로 패키징해 앱처럼 배포하는 방식입니다. iOS와 안드로이드를 한 번에 준비하면서도 푸시, 결제, 카메라 같은 네이티브 기능을 연동할 수 있습니다.",
  },
  "dual-platform-app-delivery": {
    id: "dual-platform-app-delivery",
    question: "iOS와 안드로이드를 둘 다 만들어주나요?",
    answer:
      "네. 제로소싱은 웹뷰 하이브리드 방식으로 한 번 개발해 iOS와 안드로이드에 동시 출시합니다.",
  },
  "app-store-registration": {
    id: "app-store-registration",
    question: "앱스토어·플레이스토어 등록도 해주나요?",
    answer:
      "네. 개발자 계정 설정 안내부터 스토어 등록 자료 준비, 심사 대응까지 함께 진행합니다.",
  },
  "app-native-features": {
    id: "app-native-features",
    question: "푸시 알림이나 카메라 같은 기능도 되나요?",
    answer:
      "가능합니다. 푸시 알림, 카메라, 위치, 파일 업로드, 소셜 로그인, 결제처럼 앱에서 자주 쓰는 기능은 범위와 정책을 확인한 뒤 구현합니다.",
  },
  "app-update-process": {
    id: "app-update-process",
    question: "출시 후 수정과 업데이트는 어떻게 하나요?",
    answer:
      "웹 기반으로 고칠 수 있는 영역은 빠르게 반영하고, 앱 빌드나 스토어 심사가 필요한 변경은 업데이트 일정과 심사 절차에 맞춰 진행합니다.",
  },
  "hybrid-app-suitability": {
    id: "hybrid-app-suitability",
    question: "하이브리드가 안 맞는 앱도 있나요?",
    answer:
      "고사양 3D 게임, 복잡한 실시간 그래픽, 기기 성능을 깊게 쓰는 앱은 네이티브 개발이 더 맞을 수 있습니다. 상담 단계에서 하이브리드로 충분한지 먼저 판단합니다.",
  },
  "company-homepage-time-and-cost": {
    id: "company-homepage-time-and-cost",
    question: "기업 홈페이지 제작 기간과 비용은 어떻게 되나요?",
    answer:
      "페이지 수, 디자인 범위, CMS 적용 여부에 따라 달라집니다. 상담에서 필요한 화면과 기능을 먼저 정리한 뒤 기간과 비용을 안내드립니다.",
  },
  "cms-content-updates": {
    id: "cms-content-updates",
    question: "홈페이지를 만든 뒤 내용 수정은 직접 할 수 있나요?",
    answer:
      "네. 글과 이미지를 직접 바꿀 수 있는 콘텐츠 관리 기능(CMS)을 기본 제공합니다.",
  },
  "search-engine-optimization": {
    id: "search-engine-optimization",
    question: "네이버·구글 검색에 잘 나오게 해주나요?",
    answer:
      "네. 메타태그, 사이트맵, 구조화 데이터, 페이지 속도처럼 기본 SEO 세팅을 함께 적용합니다.",
  },
  "ai-search-discoverability": {
    id: "ai-search-discoverability",
    question: "AI 검색(ChatGPT·Claude)에도 노출되나요?",
    answer:
      "회사와 서비스 정보를 구조화해 AI가 인용하기 쉬운 형태로 정리합니다.",
  },
  "responsive-company-homepage": {
    id: "responsive-company-homepage",
    question: "모바일에서도 잘 보이나요?",
    answer:
      "네. PC, 태블릿, 모바일 화면에 맞춰 반응형으로 제작해 어떤 기기에서도 단정하게 보이도록 구성합니다.",
  },
  "company-domain-hosting-ssl": {
    id: "company-domain-hosting-ssl",
    question: "도메인과 서버도 맡아 주나요?",
    answer:
      "네. 도메인 연결, 서버 배포, SSL 보안 설정까지 함께 진행할 수 있습니다.",
  },
} as const satisfies Record<string, FaqRecord>;

export type FaqId = keyof typeof faqById;
export type FaqItem = (typeof faqById)[FaqId];

export function selectFaqs(ids: readonly FaqId[]): readonly FaqItem[] {
  return ids.map((id) => faqById[id]);
}

export const commonFaqs = selectFaqs([
  "mvp-development-cost",
  "delivery-timeline",
  "outsourcing-estimate-variation",
  "planning-without-spec",
  "source-code-and-ownership",
  "mvp-post-launch-support",
  "nocode-vs-custom-development",
]);

export const pricingFaqs = selectFaqs([
  "consultation-and-estimate-free",
  "estimate-scope",
  "small-budget-mvp",
  "government-funding-development",
  "additional-costs",
]);

export const timelineFaqs = selectFaqs([
  "delivery-timeline",
  "delivery-progress-sharing",
  "scope-change",
  "expedited-launch",
  "deployment-support",
]);

export const techFaqs = selectFaqs([
  "technology-selection",
  "common-integrations",
  "source-code-delivery",
  "existing-service-enhancement",
  "nocode-to-custom-migration",
]);

export const afterLaunchFaqs = selectFaqs([
  "post-launch-maintenance",
  "post-launch-feature-prioritization",
  "incident-response",
  "admin-page-inclusion",
  "search-and-ai-discoverability",
]);

export const mvpFaqs = selectFaqs([
  "mvp-feature-scope",
  "mvp-expansion",
  "mvp-design-quality",
  "mvp-investment-or-funding",
  "government-funding-mvp",
]);

export const appFaqs = selectFaqs([
  "hybrid-vs-native",
  "dual-platform-app-delivery",
  "app-store-registration",
  "app-native-features",
  "app-update-process",
]);

export const appServiceFaqs = selectFaqs([
  "hybrid-vs-native",
  "dual-platform-app-delivery",
  "app-store-registration",
  "app-native-features",
  "app-update-process",
  "hybrid-app-suitability",
]);

export const companyHomepageFaqs = selectFaqs([
  "company-homepage-time-and-cost",
  "cms-content-updates",
  "search-engine-optimization",
  "ai-search-discoverability",
  "company-domain-hosting-ssl",
]);

export const companyHomepageServiceFaqs = selectFaqs([
  "company-homepage-time-and-cost",
  "cms-content-updates",
  "search-engine-optimization",
  "ai-search-discoverability",
  "responsive-company-homepage",
  "company-domain-hosting-ssl",
]);

export const homeFaqs = commonFaqs;
