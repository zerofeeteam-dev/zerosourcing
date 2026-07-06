import { BottomCtaBanner } from "../../../components/BottomCtaBanner";
import { FaqSection } from "../../../components/FaqSection";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { MvpFundingSection } from "../../../components/MvpFundingSection";
import { MvpIncludedSection } from "../../../components/MvpIncludedSection";
import { MvpIntroSection } from "../../../components/MvpIntroSection";
import { MvpPortfolioSection } from "../../../components/MvpPortfolioSection";
import { ProcessSection } from "../../../components/ProcessSection";
import { VideoBanner } from "../../../components/VideoBanner";
import styles from "../../page.module.css";

const mvpFaqs = [
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

export default function MvpServicePage() {
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
            title: "MVP 사례 보기",
            variant: "blue",
            width: 200,
          },
        ]}
        description={
          <>
            아이디어를 통째로 만들지 않습니다.
            <br />
            시장에 물어볼 &apos;핵심 한 조각&apos;만 빠르게. 부담은 덜고, 가설은
            가장 빨리 검증하는 MVP 개발.
          </>
        }
        eyebrow="MVP 개발"
        title="MVP 개발, 평균 4주 만에 검증까지"
      />
      <MvpIntroSection />
      <MvpFundingSection />
      <MvpIncludedSection />
      <ProcessSection order="04" paddingTop={104} />
      <MvpPortfolioSection />
      <FaqSection items={mvpFaqs} order="06" />
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
            거창한 기획서는 필요 없습니다. 아이디어만 가져오세요.
            <br />
            가능성부터 함께 점검합니다.
          </>
        }
        descriptionSize="large"
        eyebrow="MVP 개발 지금 시작하세요"
        title="그 아이디어, 4주 뒤에는 시장에 있을 수 있습니다"
      />
      <Footer />
    </main>
  );
}
