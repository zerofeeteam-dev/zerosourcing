import { BottomCtaBanner } from "../../../components/BottomCtaBanner";
import { CompanyHomepagePortfolioSection } from "../../../components/CompanyHomepagePortfolioSection";
import { CompanyHomepageSeoGeoSection } from "../../../components/CompanyHomepageSeoGeoSection";
import { CompanyHomepageScopeSection } from "../../../components/CompanyHomepageScopeSection";
import { CompanyHomepageTypesSection } from "../../../components/CompanyHomepageTypesSection";
import { FaqSection } from "../../../components/FaqSection";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { VideoBanner } from "../../../components/VideoBanner";
import styles from "../../page.module.css";

const companyHomepageFaqs = [
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

export default function CompanyHomepageServicePage() {
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
            title: "제작 사례 보기",
            variant: "blue",
            width: 200,
          },
        ]}
        description="회사의 얼굴이 되는 홈페이지. 어떤 기기에서도 단정하게, 검색에도 잘 잡히게. 기획·디자인·개발부터 도메인·서버까지 한 번에 만듭니다."
        eyebrow="기업 홈페이지 개발"
        title={
          <>
            기업 홈페이지 제작,
            <br />
            신뢰가 첫인상이 되도록
          </>
        }
      />
      <CompanyHomepagePortfolioSection />
      <CompanyHomepageTypesSection />
      <CompanyHomepageSeoGeoSection />
      <CompanyHomepageScopeSection />
      <FaqSection
        items={companyHomepageFaqs}
        order="05"
        title="기업 홈페이지 제작 자주 묻는 질문"
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
            참고하고 싶은 사이트가 있다면 함께 보여주세요.
            <br />
            분위기부터 검색 노출까지 같이 설계해 드립니다.
          </>
        }
        descriptionSize="large"
        eyebrow="기업 홈페이지 개발 지금 시작하세요"
        title={
          <>
            회사의 첫인상을
            <br />
            새로 만들어 드릴게요
          </>
        }
      />
      <Footer />
    </main>
  );
}
