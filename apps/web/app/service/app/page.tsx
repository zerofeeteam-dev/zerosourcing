import { AppBuildFlowSection } from "../../../components/AppBuildFlowSection";
import { AppDevelopmentScopeSection } from "../../../components/AppDevelopmentScopeSection";
import { AppHybridAdvantagesSection } from "../../../components/AppHybridAdvantagesSection";
import { AppPortfolioSection } from "../../../components/AppPortfolioSection";
import { BottomCtaBanner } from "../../../components/BottomCtaBanner";
import { FaqSection } from "../../../components/FaqSection";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { NativeFeaturesSection } from "../../../components/NativeFeaturesSection";
import { VideoBanner } from "../../../components/VideoBanner";
import styles from "../../page.module.css";

const appFaqs = [
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

export default function AppServicePage() {
  return (
    <main className={styles.page}>
      <div className={styles.headerLayer}>
        <Header />
      </div>
      <VideoBanner
        actions={[
          {
            icon: "message-typing",
            id: "quick",
            title: "무료 상담 신청하기",
            variant: "yellow",
            width: 200,
          },
          {
            icon: "arrow-right-banner",
            iconPosition: "right",
            id: "cases",
            title: "앱 사례 보기",
            variant: "blue",
            width: 200,
          },
        ]}
        description={
          <>
            두 번 개발할 필요 없습니다. 웹뷰 하이브리드 방식으로 한 번
            <br />
            만들어 양대 스토어에 동시 출시. 구글·애플 스토어 등록
            <br />
            대행까지 포함한 앱 개발 외주.
          </>
        }
        eyebrow="어플리케이션 개발"
        title={
          <>
            하이브리드 앱 개발,
            <br />
            iOS·안드로이드를 한 번에
          </>
        }
      />
      <AppBuildFlowSection />
      <AppHybridAdvantagesSection />
      <NativeFeaturesSection />
      <AppDevelopmentScopeSection />
      <AppPortfolioSection />
      <FaqSection
        items={appFaqs}
        order="06"
        title="앱 개발 자주 묻는 질문"
      />
      <BottomCtaBanner
        actions={[
          {
            icon: "message-typing",
            id: "quick",
            title: "무료 상담 신청하기",
            variant: "yellow",
          },
        ]}
        description={
          <>
            아이디어만 가져오세요. 어떤 방식이 맞는지부터 스토어 출시까지,
            <br />한 팀이 끝까지 함께합니다.
          </>
        }
        descriptionSize="large"
        eyebrow="어플리케이션 개발 지금 시작하세요"
        title={
          <>
            어플리케이션, 두 스토어에
            <br />
            동시에 출시합니다
          </>
        }
      />
      <Footer />
    </main>
  );
}
