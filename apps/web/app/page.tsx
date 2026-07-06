import { BusinessTypesSection } from "../components/BusinessTypesSection";
import { BottomCtaBanner } from "../components/BottomCtaBanner";
import { FaqSection } from "../components/FaqSection";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { InsightSection } from "../components/InsightSection";
import { ListeningSection } from "../components/ListeningSection";
import { PartnerLogoRollingBanner } from "../components/PartnerLogoRollingBanner";
import { partnerLogos } from "../components/partner-logos";
import { PortfolioSection } from "../components/PortfolioSection";
import { ProcessSection } from "../components/ProcessSection";
import { ProofSection } from "../components/ProofSection";
import { ServiceScopeSection } from "../components/ServiceScopeSection";
import { VideoBanner } from "../components/VideoBanner";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.headerLayer}>
        <Header />
      </div>
      <VideoBanner
        actions={[
          {
            icon: "edit-03",
            id: "outsource",
            title: "외주 문의하기",
            variant: "blue",
          },
          {
            icon: "message-typing",
            id: "quick",
            title: "간편 문의하기",
            variant: "yellow",
          },
        ]}
        description="과한 스펙도, 긴 일정도 없이. 핵심만 담아 빠르게 검증하는 MVP 개발 파트너."
        eyebrow="MVP / 홈페이지 / 어플리케이션"
        title={
          <>
            부담은 제로, 출시는 현실로
            <br />
            MVP·홈페이지 개발 파트너, 제로소싱
          </>
        }
      />
      <PartnerLogoRollingBanner logos={partnerLogos} />
      <ListeningSection />
      <BusinessTypesSection />
      <ProofSection />
      <ServiceScopeSection />
      <ProcessSection />
      <PortfolioSection />
      <InsightSection />
      <FaqSection />
      <BottomCtaBanner
        actions={[
          {
            icon: "edit-03",
            id: "outsource",
            title: "외주 문의하기",
            variant: "blue",
          },
          {
            icon: "message-typing",
            id: "quick",
            title: "간편 상담받기",
            variant: "yellow",
          },
        ]}
        description="가능성부터 함께 점검해 드릴게요. 상담은 무료입니다."
        eyebrow="MVP / 홈페이지 / 어플리케이션 개발 지금 시작하세요"
        title="아이디어, 부담 없이 이야기해보세요"
      />
      <Footer />
    </main>
  );
}
