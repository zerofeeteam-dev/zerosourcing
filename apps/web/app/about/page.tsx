import { AboutCompanySection } from "../../components/AboutCompanySection";
import { AboutIntroSection } from "../../components/AboutIntroSection";
import { AboutHowSection } from "../../components/AboutHowSection";
import { AboutPrinciplesSection } from "../../components/AboutPrinciplesSection";
import { BottomCtaBanner } from "../../components/BottomCtaBanner";
import { BusinessTypesSection } from "../../components/BusinessTypesSection";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { ProofPartnerLogoBanner } from "../../components/ProofPartnerLogoBanner";
import { VideoBanner } from "../../components/VideoBanner";
import styles from "../page.module.css";

export default function AboutPage() {
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
            title: "포트폴리오 확인하기",
            variant: "blue",
            width: 200,
          },
        ]}
        description={
          <>
            &quot;MVP 개발, 얼마나 걸리나요?&quot; 고객님들이 가장 많이 하시는
            질문입니다.
            <br />
            제로소싱은 목적에 맞는 방법으로, 필요할 때는 AI를 활용하여 부담은
            덜고 출시는 앞당기는 MVP 개발 외주 팀입니다.
          </>
        }
        eyebrow="MVP / 홈페이지 / 어플리케이션"
        title="가장 빠른 방법으로 MVP를 만드는 팀"
      />
      <AboutIntroSection />
      <AboutPrinciplesSection />
      <AboutHowSection />
      <BusinessTypesSection
        description={
          <>
            아이디어의 형태에 맞춰 필요한 만큼만 만듭니다.
            <br />각 서비스의 자세한 내용은 서비스 페이지에서 확인하세요.
          </>
        }
        label="제로소싱이 만드는 것"
        order="04"
        title={
          <>
            검증할 제품부터,
            <br />
            비즈니스의 무대까지
          </>
        }
      />
      <AboutCompanySection />
      <ProofPartnerLogoBanner compact />
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
        eyebrow="MVP / 홈페이지 / 어플리케이션 개발 지금 시작하세요"
        title="당신의 아이디어도 현실이 될 수 있습니다"
      />
      <Footer />
    </main>
  );
}
