import type { IconName } from "../../../components/Icon";

export const appBuildFlowSteps = [
  {
    description: "화면·기능을 웹으로 한 번만(반응형 개발)",
    eyebrow: "SOURCE",
    title: "웹 코드 한 벌",
  },
  {
    description: "네이티브로 감싸 앱 빌드",
    eyebrow: "PACKAGING",
    title: "RN 패키징",
    variant: "brand",
  },
  {
    description: "앱스토어 앱 심사 대행까지",
    eyebrow: "APP STORE",
    title: "iOS 앱",
  },
  {
    description: "플레이스토어 앱 심사 대행까지",
    eyebrow: "GOOGLE PLAY",
    title: "안드로이드 앱",
  },
] as const;

export const appHybridAdvantages = [
  {
    description:
      "iOS용, 안드로이드용을 따로 개발하면 인력도 코드도 두 벌이 필요합니다. 하이브리드는 하나의 코드에서 두 OS 앱을 함께 빌드하기 때문에, 같은 앱이라도 네이티브 외주 대비 비용과 일정을 절반에 가깝게 줄입니다.",
    icon: "component",
    title: "한 번 개발, 두 OS",
  },
  {
    description:
      "네이티브 앱은 작은 문구 하나를 고쳐도 스토어 심사를 다시 받아야 해, 반영까지 며칠이 걸리기도 합니다. 하이브리드는 웹 기반이라 콘텐츠·기능 수정의 상당 부분이 스토어 재심사 없이 즉시 반영됩니다. 빠르게 고치고 빠르게 검증할 수 있습니다.",
    icon: "arrow-refresh-04",
    title: "빠른 업데이트",
  },
  {
    description:
      '"웹사이트를 앱처럼 보이게 한 것 아니냐"는 오해를 자주 받지만, 다릅니다. React Native로 패키징하기 때문에 푸시 알림, 결제, 카메라, 위치, 생체 인증 같은 기능을 그대로 씁니다. 사용자는 하이브리드인지 알아채지 못합니다.',
    icon: "code-02",
    title: "네이티브 기능",
  },
  {
    description:
      "두 번 만들지 않고, 두 번 고치지 않습니다. 그만큼 출시까지의 시간과 비용이 줄어, 초기 자금이 빠듯한 스타트업도 부담 없이 시작할 수 있습니다. 아낀 자원은 검증과 다음 개선에 씁니다.",
    icon: "currency-coin-dollar",
    title: "비용·일정 절감",
  },
] as const satisfies readonly {
  description: string;
  icon: IconName;
  title: string;
}[];

export const appNativeFeatures = [
  {
    description: "재방문을 높이는 맞춤 알림 전송",
    iconName: "bell-02",
    title: "푸시 알림",
  },
  {
    description: "카드·간편결제·인앱 구매 연동",
    iconName: "card-02",
    title: "결제·인앱결제",
  },
  {
    description: "GPS 기반 위치·길찾기·주변 검색",
    iconName: "map-02",
    title: "지도·위치",
  },
  {
    description: "사진 촬영·QR·바코드 스캔",
    iconName: "camera-lens",
    title: "카메라·QR",
  },
  {
    description: "카카오·네이버·애플 간편 로그인",
    iconName: "user-profile-03",
    title: "소셜 로그인",
  },
  {
    description: "기기·태그·결제 단말과 직접 연동",
    iconName: "component",
    title: "블루투스·NFC",
  },
  {
    description: "사진·문서 업로드와 저장",
    iconName: "image-03",
    title: "파일·갤러리",
  },
  {
    description: "OS 네이티브 공유 시트 연동",
    iconName: "share",
    title: "공유하기",
  },
] as const satisfies readonly {
  description: string;
  iconName: IconName;
  title: string;
}[];

export const appDevelopmentIncludedItems = [
  "기획",
  "디자인",
  "웹 개발",
] as const;

export const appDevelopmentDifferences = [
  {
    eyebrow: "DIFFERENCE 01",
    items: [
      "웹을 React Native로 감싸 앱 빌드",
      "푸시·결제·카메라 등 네이티브 연동",
      "iOS·안드로이드 빌드 동시 설정",
      "실기기 테스트로 앱다운 동작 확인",
    ],
    subtitle: "React Native Packaging",
    summary: "웹사이트를 앱처럼이 아니라, 진짜 앱으로 만드는 핵심 단계",
    title: "RN 패키징",
  },
  {
    eyebrow: "DIFFERENCE 02",
    items: [
      "개발자 계정 설정 안내",
      "스토어 등록 자료 준비",
      "애플·구글 심사 대응",
      "출시 후 버그 영구 보장",
    ],
    subtitle: "App Store · Google Play",
    summary: "비개발자가 가장 막막해하는 단계를, 끝까지 대신합니다",
    title: "스토어 등록 대행",
  },
] as const;

export const appFaqs = [
  {
    question: "웹뷰 하이브리드 앱은 네이티브 앱과 뭐가 다른가요?",
    answer:
      "웹 기술로 화면과 기능을 만들고 React Native로 패키징해 앱처럼 배포하는 방식입니다. iOS와 안드로이드를 한 번에 준비하면서도 푸시, 결제, 카메라 같은 네이티브 기능을 연동할 수 있습니다.",
  },
  {
    question: "iOS와 안드로이드를 둘 다 만들어주나요?",
    answer:
      "네. 제로소싱은 웹뷰 하이브리드 방식으로 한 번 개발해 iOS와 안드로이드에 동시 출시합니다. 두 OS를 따로 개발할 필요가 없어 시간과 비용이 절반에 가깝게 줄어듭니다.",
  },
  {
    question: "앱스토어·플레이스토어 등록도 해주나요?",
    answer:
      "네. 개발자 계정 설정 안내부터 스토어 등록 자료 준비, 심사 대응까지 함께 진행합니다. 처음 앱을 출시하는 경우에도 필요한 절차를 단계별로 정리해드립니다.",
  },
  {
    question: "푸시 알림이나 카메라 같은 기능도 되나요?",
    answer:
      "가능합니다. 푸시 알림, 카메라, 위치, 파일 업로드, 소셜 로그인, 결제처럼 앱에서 자주 쓰는 기능은 범위와 정책을 확인한 뒤 구현합니다.",
  },
  {
    question: "출시 후 수정과 업데이트는 어떻게 하나요?",
    answer:
      "웹 기반으로 고칠 수 있는 영역은 빠르게 반영하고, 앱 빌드나 스토어 심사가 필요한 변경은 업데이트 일정과 심사 절차에 맞춰 진행합니다.",
  },
  {
    question: "하이브리드가 안 맞는 앱도 있나요?",
    answer:
      "고사양 3D 게임, 복잡한 실시간 그래픽, 기기 성능을 깊게 쓰는 앱은 네이티브 개발이 더 맞을 수 있습니다. 상담 단계에서 하이브리드로 충분한지 먼저 판단합니다.",
  },
] as const;
