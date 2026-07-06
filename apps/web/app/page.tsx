import { BusinessTypesSection } from "../components/BusinessTypesSection";
import { Header } from "../components/Header";
import { ListeningSection } from "../components/ListeningSection";
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
      <ListeningSection />
      <BusinessTypesSection />
    </main>
  );
}
