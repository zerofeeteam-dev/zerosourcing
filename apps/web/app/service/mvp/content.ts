export const mvpIntroCards = [
  {
    eyebrow: "MISUNDERSTOOD",
    title: "흔한 오해",
    description: [
      "MVP는 대충 만든 반쪽짜리가 아닙니다. 기능이 적을 뿐,핵심은 제대로 작동해야 사용자에게 물어볼 수 있습니다.",
    ],
  },
  {
    eyebrow: "WHAT IT IS",
    title: "제대로 된 MVP",
    description: [
      `가장 중요한 가설 하나를, 가장 빠르게 검증하는 제품."이게 팔릴까?"에 시장이 직접 답하게 만드는 도구입니다.`,
    ],
  },
] as const;

export const fundingPrograms = [
  {
    tag: "예비창업자",
    title: "예비창업패키지",
    description:
      "창업 전 단계. 사업화 자금과 멘토링을 지원해, 아이디어를 처음 제품으로 만들 때 가장 많이 활용됩니다.",
  },
  {
    tag: "창업 3년 이내",
    title: "초기창업패키지",
    description:
      "이미 창업한 초기 기업의 사업화를 지원. MVP를 고도화하거나 다음 버전으로 확장할 때 적합합니다.",
  },
  {
    tag: "청년 창업자",
    title: "청년창업사관학교",
    description:
      "자금·공간·교육을 함께 지원하는 집중 프로그램. 제품화 일정이 빠듯해 빠른 MVP 개발이 특히 중요합니다.",
  },
  {
    tag: "소상공인·생활창업",
    title: "모두의 창업 외",
    description:
      "신사업창업사관학교 등 다양한 창업 지원사업. 업종에 맞는 웹·앱 형태로 사업 아이템을 구현해 드립니다.",
  },
] as const;

export const supportSteps = [
  "데모데이·중간점검 일정에 맞춘 MVP 납기 조율",
  "사업비 집행용 견적서·계약서·증빙 서류 협조",
  "심사·발표에서 강한 '작동하는 데모' 중심 설계",
  "선정 후 확장까지 내다본 구조로 개발",
] as const;

export const supportStepText = supportSteps
  .map((step, index) => `${String(index + 1).padStart(2, "0")}. ${step}`)
  .join(" ");

export const mvpIncludedCards = [
  {
    eyebrow: "STEP 01",
    title: "기획",
    description: ["핵심 기능 정의 · 화면 설계"],
  },
  {
    eyebrow: "STEP 02",
    title: "디자인",
    description: ["핵심 화면 UX/UI"],
  },
  {
    eyebrow: "STEP 03",
    title: "개발",
    description: ["프론트 · 백엔드 · DB · 핵심 기능"],
  },
  {
    eyebrow: "STEP 04",
    title: "출시",
    description: ["도메인 · 서버 · 배포"],
  },
  {
    eyebrow: "STEP 05",
    title: "검증 · 보장",
    description: ["데이터 분석 세팅 · 버그 영구 보장"],
  },
] as const;

export const mvpFaqs = [
  {
    question: "MVP에 기능은 보통 몇 개나 넣나요?",
    answer:
      "보통 1~3개의 핵심 기능만 넣습니다. 회원가입, 결제, 관리자처럼 검증에 꼭 필요한 기능을 먼저 정하고, 있어도 없어도 되는 기능은 다음 단계로 미룹니다.",
  },
  {
    question: "MVP만 만들고 끝나면, 나중에 확장은 어떻게 하나요?",
    answer:
      "처음부터 확장 가능한 구조를 염두에 두고 개발합니다. 검증 후 사용자 반응과 데이터를 기준으로 기능을 추가하거나 정식 서비스로 고도화할 수 있습니다.",
  },
  {
    question: "MVP라서 디자인 완성도는 떨어지나요?",
    answer:
      "검증에 필요한 화면은 실제 서비스처럼 사용할 수 있게 만듭니다. 과한 장식보다 핵심 흐름, 신뢰감, 사용성을 우선해 MVP 단계에 맞는 완성도로 정리합니다.",
  },
  {
    question: "MVP 결과물로 투자 유치나 정부지원사업에 활용할 수 있나요?",
    answer:
      "가능합니다. 데모, 중간점검, 발표에서 보여줄 수 있는 작동형 결과물과 화면 흐름을 목표에 맞춰 준비합니다.",
  },
  {
    question: "정부지원금으로 MVP 개발비를 낼 수 있나요?",
    answer:
      "가능합니다. 지원사업 요구에 맞춰 견적서, 계약서, 증빙 서류 협조가 필요한 경우 진행 단계에 맞춰 도와드립니다.",
  },
] as const;
