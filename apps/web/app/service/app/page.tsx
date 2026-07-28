import Image from "next/image";

import { BottomCtaBanner } from "../../../components/BottomCtaBanner";
import { FaqSection } from "../../../components/FaqSection";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { Icon } from "../../../components/Icon";
import { JsonLd } from "../../../components/JsonLd";
import { SectionShell } from "../../../components/SectionShell";
import { ServicePortfolioSection } from "../../../components/ServicePortfolioSection";
import { VideoBanner } from "../../../components/VideoBanner";
import { appServiceFaqs } from "../../../content/faqs";
import { createServiceJsonLd } from "../../../lib/seo/structured-data";
import styles from "../../page.module.css";
import { createPageMetadata } from "../../site-metadata";
import {
  appBuildFlowSteps,
  appDevelopmentDifferences,
  appDevelopmentIncludedItems,
  appHybridAdvantages,
  appNativeFeatures,
} from "./content";
import appStyles from "./page.module.css";

export const dynamic = "force-dynamic";

const servicePageMetadata = {
  title: "제로소싱 | 하이브리드 앱 개발 (iOS·안드로이드)",
  description:
    "제로소싱의 하이브리드 앱 개발은 한 번 개발해 iOS·안드로이드에 동시 출시합니다. 푸시·결제 등 네이티브 기능 연동과 구글·애플 스토어 등록 대행 포함. 앱 개발 비용·기간을 안내합니다.",
  path: "/service/app",
} as const;

export const metadata = createPageMetadata({ ...servicePageMetadata });

const serviceJsonLd = createServiceJsonLd({
  description: servicePageMetadata.description,
  name: "하이브리드 앱 개발",
  path: servicePageMetadata.path,
  serviceType: "앱 개발",
});

const [sourceStep, packagingStep, appStoreStep, googlePlayStep] =
  appBuildFlowSteps;

export default function AppServicePage() {
  return (
    <main className={styles.page}>
      <JsonLd data={serviceJsonLd} id="app-service-json-ld" />
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
      <SectionShell
        className={appStyles.appBuildSection}
        description={
          <>
            제로소싱의 앱은 웹 기술로 화면을 만들고, 이를 React Native로
            패키징해 출시하는 &apos;웹뷰 하이브리드&apos; 방식입니다.
            <br />
            하나의 코드로 iOS와 안드로이드를 모두 만들어, 두 배의 일을 한 번으로
            줄입니다.
          </>
        }
        label="어떻게 만드나요"
        order="01"
        title={
          <>
            한 벌의 코드가,
            <br />두 개의 앱이 됩니다
          </>
        }
      >
        <div className={appStyles.appBuildFlow} data-node-id="43:3305">
          <article className={appStyles.appBuildCard}>
            <p className={appStyles.appBuildEyebrow}>{sourceStep.eyebrow}</p>
            <div className={appStyles.appBuildCopy}>
              <h3 className={appStyles.appBuildCardTitle}>
                {sourceStep.title}
              </h3>
              <p className={appStyles.appBuildCardDescription}>
                {sourceStep.description}
              </p>
            </div>
          </article>
          <Icon
            aria-hidden="true"
            className={appStyles.appBuildArrow}
            name="chevron-right"
            size={24}
          />
          <article
            className={`${appStyles.appBuildCard} ${appStyles.appBuildBrandCard}`}
          >
            <p className={appStyles.appBuildEyebrow}>{packagingStep.eyebrow}</p>
            <div className={appStyles.appBuildCopy}>
              <h3 className={appStyles.appBuildCardTitle}>
                {packagingStep.title}
              </h3>
              <p className={appStyles.appBuildCardDescription}>
                {packagingStep.description}
              </p>
            </div>
          </article>
          <Icon
            aria-hidden="true"
            className={appStyles.appBuildArrow}
            name="chevron-right"
            size={24}
          />
          <div className={appStyles.appBuildStoreStack}>
            {[appStoreStep, googlePlayStep].map((step) => (
              <article className={appStyles.appBuildCard} key={step.title}>
                <p className={appStyles.appBuildEyebrow}>{step.eyebrow}</p>
                <div className={appStyles.appBuildCopy}>
                  <h3 className={appStyles.appBuildCardTitle}>{step.title}</h3>
                  <p className={appStyles.appBuildCardDescription}>
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>
      <SectionShell
        description={
          <>
            &apos;웹사이트를 앱처럼 보이게&apos;가 아닙니다.
            <br />
            React Native로 패키징해 네이티브 기능까지 쓰는, 진짜 앱입니다.
          </>
        }
        label="왜 하이브리드인가"
        order="02"
        title={
          <>
            하이브리드 앱 개발의
            <br />
            4가지 장점
          </>
        }
      >
        <div className={appStyles.appAdvantageList} data-node-id="43:3344">
          {appHybridAdvantages.map((advantage) => (
            <article
              className={appStyles.appAdvantageCard}
              key={advantage.title}
            >
              <span
                aria-hidden="true"
                className={appStyles.appAdvantageIconBox}
              >
                <Icon name={advantage.icon} size={24} />
              </span>
              <div className={appStyles.appAdvantageCopy}>
                <h3 className={appStyles.appAdvantageCardTitle}>
                  {advantage.title}
                </h3>
                <p className={appStyles.appAdvantageDescription}>
                  {advantage.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>
      <SectionShell
        className={appStyles.appNativeSection}
        description="React Native 패키징으로 아래 기능을 그대로 씁니다. 사용자는 하이브리드인지 알아채지 못합니다."
        label="앱 네이티브 기능"
        order="03"
        title={
          <>
            React Native로 구현하는
            <br />
            네이티브 기능
          </>
        }
      >
        <div className={appStyles.appNativeFeatureGrid} data-node-id="50:4639">
          {appNativeFeatures.map((feature) => (
            <article
              className={appStyles.appNativeFeatureCard}
              key={feature.title}
            >
              <div className={appStyles.appNativeFeatureHeading}>
                <span
                  aria-hidden="true"
                  className={appStyles.appNativeFeatureIconFrame}
                >
                  <Icon name={feature.iconName} size={24} />
                </span>
                <h3 className={appStyles.appNativeFeatureCardTitle}>
                  {feature.title}
                </h3>
              </div>
              <p className={appStyles.appNativeFeatureCardDescription}>
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </SectionShell>
      <SectionShell
        className={appStyles.appScopeSection}
        description={
          <>
            개발만 던져주고 끝내지 않습니다. 가장 까다로운 스토어 등록까지
            대행해,
            <br />
            출시 버튼만 누르면 되도록 준비합니다. 각 단계에서 실제로 무엇을
            하는지 정리했습니다.
          </>
        }
        label="앱 개발 범위"
        order="04"
        title={
          <>
            기획·디자인·개발부터
            <br />
            스토어 등록까지
          </>
        }
      >
        <div className={appStyles.appScopeContent} data-node-id="43:3826">
          <div className={appStyles.appScopeIncluded}>
            <p className={appStyles.appScopeIncludedLabel}>기본 포함</p>
            <div className={appStyles.appScopeIncludedItems}>
              {appDevelopmentIncludedItems.map((item, index) => (
                <span className={appStyles.appScopeIncludedPair} key={item}>
                  {index > 0 ? (
                    <span className={appStyles.appScopePlus}>+</span>
                  ) : null}
                  <span className={appStyles.appScopeIncludedChip}>{item}</span>
                </span>
              ))}
            </div>
          </div>

          <div className={appStyles.appScopeCards}>
            {appDevelopmentDifferences.map((difference) => (
              <article
                className={appStyles.appScopeCard}
                key={difference.title}
              >
                <div className={appStyles.appScopeCardHeader}>
                  <p className={appStyles.appScopeEyebrow}>
                    {difference.eyebrow}
                  </p>
                  <div className={appStyles.appScopeTitleGroup}>
                    <h3 className={appStyles.appScopeCardTitle}>
                      {difference.title}
                    </h3>
                    <p className={appStyles.appScopeSubtitle}>
                      {difference.subtitle}
                    </p>
                  </div>
                </div>
                <div className={appStyles.appScopeCardBody}>
                  <p className={appStyles.appScopeSummary}>
                    {difference.summary}
                  </p>
                  <ul className={appStyles.appScopeItemList}>
                    {difference.items.map((item) => (
                      <li className={appStyles.appScopeItem} key={item}>
                        <Image
                          alt=""
                          className={appStyles.appScopeZMark}
                          height={16}
                          src="/brand/zerofee-service-mark.svg"
                          width={16}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className={appStyles.appScopeNotice}>
            <p className={appStyles.appScopeNoticeTitle}>등록 대행 포함</p>
            <p className={appStyles.appScopeNoticeText}>
              스토어 등록은 비개발자가 가장 막막해하는 단계입니다.
              <br />
              개발자 계정 설정부터 스토어 등록 자료 준비, 반려 사유가 까다로운{" "}
              <strong>애플·구글 심사 대응까지</strong> 제로소싱이 맡습니다. 처음
              앱을 내는 분도 심사에 헤매지 않고 출시할 수 있고, 출시 후{" "}
              <strong>버그는 기간 제한 없이 영구 보장</strong>합니다.
            </p>
          </div>
        </div>
      </SectionShell>
      <ServicePortfolioSection
        contentNodeId="43:3501"
        label="어플리케이션 포트폴리오"
        order="05"
        portfolioType="application"
        title="하이브리드 앱 개발 사례"
      />
      <FaqSection
        items={appServiceFaqs}
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
