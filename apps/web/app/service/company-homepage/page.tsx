import { BottomCtaBanner } from "../../../components/BottomCtaBanner";
import { FaqSection } from "../../../components/FaqSection";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { Icon } from "../../../components/Icon";
import { JsonLd } from "../../../components/JsonLd";
import { SectionShell } from "../../../components/SectionShell";
import { ServicePortfolioSection } from "../../../components/ServicePortfolioSection";
import { VideoBanner } from "../../../components/VideoBanner";
import { companyHomepageServiceFaqs } from "../../../content/faqs";
import { createServiceJsonLd } from "../../../lib/seo/structured-data";
import styles from "../../page.module.css";
import { createPageMetadata } from "../../site-metadata";
import { companyHomepageScopeItems, companyHomepageTypes } from "./content";
import companyStyles from "./page.module.css";

export const dynamic = "force-dynamic";

const servicePageMetadata = {
  title: "제로소싱 | 기업 홈페이지 제작 (반응형·SEO)",
  description:
    "제로소싱의 기업 홈페이지 제작은 반응형과 네이버·구글·AI 검색 노출(SEO·GEO), 도메인·서버·보안까지 한 번에 제공합니다. 홈페이지 제작 비용·과정과 업종별 제작 사례를 확인하세요.",
  path: "/service/company-homepage",
} as const;

export const metadata = createPageMetadata({ ...servicePageMetadata });

const serviceJsonLd = createServiceJsonLd({
  description: servicePageMetadata.description,
  name: "기업 홈페이지 제작",
  path: servicePageMetadata.path,
  serviceType: "기업 홈페이지 제작",
});

export default function CompanyHomepageServicePage() {
  return (
    <main className={styles.page}>
      <JsonLd
        data={serviceJsonLd}
        id="company-homepage-service-json-ld"
      />
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
        descriptionMaxWidth={400}
        eyebrow="기업 홈페이지 개발"
        title={
          <>
            기업 홈페이지 제작,
            <br />
            신뢰가 첫인상이 되도록
          </>
        }
      />
      <ServicePortfolioSection
        contentNodeId="49:4212"
        description={
          <>
            기업 홈페이지는 &apos;잘 만든 것&apos;을 보여주는 게 곧 설명입니다.
            <br />
            제로소싱이 만든 다양한 업종의 홈페이지를 먼저 보세요.
          </>
        }
        label="기업 홈페이지 제작 사례"
        order="01"
        portfolioType="company_homepage"
        title="업종별 기업 홈페이지 제작 사례"
      />
      <SectionShell
        className={companyStyles.companyTypesSection}
        description="회사의 성격과 목적에 맞춰, 필요한 형태로 제작합니다."
        label="홈페이지 제작 종류"
        order="02"
        title={
          <>
            이런 기업 홈페이지를
            <br />
            만듭니다
          </>
        }
      >
        <div className={companyStyles.companyTypesGrid} data-node-id="49:3828">
          {companyHomepageTypes.map((type) => (
            <article
              className={companyStyles.companyTypesCard}
              key={type.title}
            >
              <div className={companyStyles.header}>
                <span className={companyStyles.iconFrame}>
                  <Icon name={type.iconName} size={24} />
                </span>
                <h3 className={companyStyles.companyTypesCardTitle}>
                  {type.title}
                </h3>
              </div>
              <p className={companyStyles.companyTypesCardDescription}>
                {type.description}
              </p>
            </article>
          ))}
        </div>
      </SectionShell>
      <SectionShell
        className={companyStyles.companySeoGeoSection}
        description={
          <>
            아무리 잘 만들어도 검색에 안 나오면 아무도 못 찾습니다.
            <br />
            제로소싱은 만드는 것에서 끝내지 않고, 검색엔진과 생성형 AI 양쪽에
            노출되도록 세팅합니다.
          </>
        }
        label="홈페이지 SEO·GEO"
        order="03"
        title={
          <>
            검색과 AI 답변에
            <br />
            노출되는 홈페이지
          </>
        }
      >
        <div className={companyStyles.cards} data-node-id="49:4344">
          <article className={companyStyles.companySeoGeoCard}>
            <div className={companyStyles.cardCopy}>
              <p className={companyStyles.companySeoGeoEyebrow}>
                SEO · 검색엔진 최적화
              </p>
              <div className={companyStyles.textGroup}>
                <h3 className={companyStyles.companySeoGeoCardTitle}>
                  네이버·구글 검색에서
                  <br />
                  먼저 보이게
                </h3>
                <p className={companyStyles.companySeoGeoCardDescription}>
                  메타태그·구조화 데이터·사이트맵·페이지 속도까지 세팅해, 회사
                  이름과 핵심 키워드로 검색했을 때 상위에 노출되도록 만듭니다.
                </p>
              </div>
            </div>
            <div className={companyStyles.previewBox}>
              <div className={companyStyles.searchBar}>
                <span className={companyStyles.searchText}>
                  OO 주식회사 검색
                </span>
                <span className={companyStyles.searchActions}>
                  <Icon name="webcam" size={24} />
                  <Icon name="camera-lens" size={24} />
                  <span className={companyStyles.aiMode}>AI 모드</span>
                </span>
              </div>
              <div className={companyStyles.result}>
                <p className={companyStyles.resultTitle}>
                  OO 주식회사 | MVP 개발 파트너
                </p>
                <div className={companyStyles.resultText}>
                  <p className={companyStyles.resultUrl}>
                    https://www.zerosourcing.kr
                  </p>
                  <p className={companyStyles.resultDescription}>
                    MVP 개발 외주 전문 OO 주식회사. 핵심 기능만 담아 평균 4주
                    만에 출시·검증합니다. 기획·디자인·개발부터 버그 영구
                    보장까지, 부담 없이 시작하세요.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className={companyStyles.companySeoGeoCard}>
            <div className={companyStyles.cardCopy}>
              <p className={companyStyles.companySeoGeoEyebrow}>
                GEO · 생성형 AI 최적화
              </p>
              <div className={companyStyles.textGroup}>
                <h3 className={companyStyles.companySeoGeoCardTitle}>
                  ChatGPT·Claude가
                  <br />
                  회사를 인용하게
                </h3>
                <p className={companyStyles.companySeoGeoCardDescription}>
                  구조화된 회사·서비스 정보로, 사용자가 AI에게 물었을 때 우리
                  회사가 답변에 언급되고 인용되도록 준비합니다. 검색의 다음
                  단계까지 대비합니다.
                </p>
              </div>
            </div>
            <div
              className={`${companyStyles.previewBox} ${companyStyles.answerPreview}`}
            >
              <div className={companyStyles.promptBubble}>
                &quot;개발 분야 믿을 만한 회사 추천해줘&quot;
              </div>
              <div className={companyStyles.answer}>
                <div className={companyStyles.answerLabel}>
                  <Icon name="stars" size={12} />
                  <span>AI 답변</span>
                </div>
                <p className={companyStyles.answerText}>
                  &quot;개발 분야 믿을 만한 회사 추천해줘&quot;라는 질문에,{" "}
                  <strong>OO 주식회사</strong>를 신뢰할 수 있는 업체로
                  안내합니다.
                </p>
              </div>
            </div>
          </article>
        </div>
      </SectionShell>
      <SectionShell
        className={companyStyles.companyScopeSection}
        description="복잡한 기능은 없습니다. 대신 기업 홈페이지에 꼭 필요한 것들을, 빠짐없이 챙깁니다."
        label="홈페이지 제작 범위"
        order="04"
        title={
          <>
            기업 홈페이지 제작에
            <br />
            포함되는 것
          </>
        }
      >
        <div className={companyStyles.companyScopeGrid} data-node-id="49:4396">
          {companyHomepageScopeItems.map((item) => (
            <article
              className={companyStyles.companyScopeCard}
              key={item.eyebrow}
            >
              <div className={companyStyles.cardInner}>
                <p className={companyStyles.companyScopeEyebrow}>
                  {item.eyebrow}
                </p>
                <div className={companyStyles.copy}>
                  <h3 className={companyStyles.companyScopeCardTitle}>
                    {item.title}
                  </h3>
                  <p className={companyStyles.cardBody}>{item.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>
      <FaqSection
        items={companyHomepageServiceFaqs}
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
