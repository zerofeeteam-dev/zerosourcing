import { BottomCtaBanner } from "../../../components/BottomCtaBanner";
import { FaqSection } from "../../../components/FaqSection";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { ProcessSection } from "../../../components/ProcessSection";
import { SectionShell } from "../../../components/SectionShell";
import { ServicePortfolioSection } from "../../../components/ServicePortfolioSection";
import { VideoBanner } from "../../../components/VideoBanner";
import { mvpFaqs } from "../../../content/faqs";
import styles from "../../page.module.css";
import { createPageMetadata } from "../../site-metadata";
import {
  fundingPrograms,
  mvpIncludedCards,
  mvpIntroCards,
  supportStepText,
} from "./content";
import mvpStyles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "제로소싱 | MVP 개발 외주, 평균 4주 출시",
  description:
    "제로소싱의 MVP 개발 외주는 검증되는 MVP를 평균 4주 만에 제작합니다. 예비창업패키지 등 정부지원금 집행이 가능하고, 기능별 정찰가로 견적이 투명합니다. MVP 개발 비용·기간·진행 방식을 안내합니다.",
  path: "/service/mvp",
});

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
      <SectionShell
        className={mvpStyles.introSection}
        description={
          <>
            MVP(Minimum Viable Product)는 &apos;최소 기능 제품&apos;입니다.
            <br />
            모든 걸 다 만드는 게 아니라, 시장에 던질 가설을 검증할 최소한만
            빠르게 만드는 것이 핵심입니다.
          </>
        }
        label="MVP란 무엇인가"
        order="01"
        title={
          <>
            완성품을 싸게가 아니라,
            <br />
            핵심만 제대로
          </>
        }
      >
        <div className={mvpStyles.introCards} data-node-id="291:55423">
          {mvpIntroCards.map((card) => (
            <article className={mvpStyles.infoCard} key={card.eyebrow}>
              <div className={mvpStyles.infoCardInner}>
                <p className={mvpStyles.infoCardEyebrow}>{card.eyebrow}</p>
                <div className={mvpStyles.infoCardCopy}>
                  <h3 className={mvpStyles.infoCardTitle}>{card.title}</h3>
                  <p
                    className={`${mvpStyles.infoCardDescription} ${mvpStyles.introCardDescription}`}
                  >
                    {card.description.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>
      <SectionShell
        className={mvpStyles.fundingSection}
        description={
          <>
            예비창업패키지·초기창업패키지·청년창업사관학교처럼 경쟁률 높은
            사업일수록,
            <br />
            아이디어를 &apos;작동하는 형태&apos;로 보여주는 팀이 유리합니다.
            그리고 그 MVP는, 받은 지원금으로 만들 수 있습니다.
          </>
        }
        label="정부지원사업과 MVP"
        order="02"
        title={
          <>
            지원사업 합격에도,
            <br />
            MVP가 무기가 됩니다
          </>
        }
      >
        <div className={mvpStyles.fundingContent} data-node-id="30:1562">
          <div className={mvpStyles.fundingAlert} data-node-id="30:1536">
            <h3 className={mvpStyles.fundingAlertTitle}>
              창업 지원금으로 MVP 제작비 집행 가능
            </h3>
            <p className={mvpStyles.fundingAlertText}>
              대부분의 창업지원사업은{" "}
              <strong>사업화 자금으로 외주 개발비(MVP 제작비) 집행</strong>을
              허용합니다.
              <br />
              즉, 내 돈을 들이지 않고도 검증 가능한 제품을 손에 쥘 수 있습니다.
              제로소싱은 사업비 집행에 필요한 견적서·증빙 서류를 함께 준비해
              드립니다.
            </p>
          </div>

          <div className={mvpStyles.fundingProgramGrid} data-node-id="30:1539">
            {fundingPrograms.map((program) => (
              <article
                className={mvpStyles.fundingProgramCard}
                key={program.title}
              >
                <div className={mvpStyles.fundingProgramInner}>
                  <span className={mvpStyles.fundingProgramTag}>
                    {program.tag}
                  </span>
                  <div className={mvpStyles.fundingProgramCopy}>
                    <h3 className={mvpStyles.fundingProgramTitle}>
                      {program.title}
                    </h3>
                    <p className={mvpStyles.fundingProgramDescription}>
                      {program.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className={mvpStyles.fundingNotes} data-node-id="30:1688">
            <div className={mvpStyles.fundingNoteGroup}>
              <p className={mvpStyles.fundingNoteTitle}>
                ※ 제로소싱이 지원사업을 돕는 방식
              </p>
              <p className={mvpStyles.fundingStepText}>{supportStepText}</p>
            </div>
            <p className={mvpStyles.fundingNoteText}>
              ※ 지원 규모와 사업비 집행 가능 항목은 사업·연도별 공고에 따라
              다릅니다. 선정 후 해당 사업의 집행 기준을 함께 확인해 드리며,
              제로소싱은 지원사업의 선정을 보장하지 않습니다.
            </p>
          </div>
        </div>
      </SectionShell>
      <SectionShell
        className={mvpStyles.includedSection}
        description={
          <>
            &apos;만들어 주는 것&apos;에서 끝나지 않습니다. 기획부터 영구
            보장까지, 다섯 단계가 한 번에 들어갑니다.
          </>
        }
        label="무엇이 포함되나요"
        order="03"
        title={
          <>
            MVP 하나에,
            <br />
            출시와 보장까지 한 묶음
          </>
        }
      >
        <div className={mvpStyles.includedCards} data-node-id="30:1108">
          {mvpIncludedCards.map((card) => (
            <article className={mvpStyles.infoCard} key={card.eyebrow}>
              <div className={mvpStyles.infoCardInner}>
                <p className={mvpStyles.infoCardEyebrow}>{card.eyebrow}</p>
                <div className={mvpStyles.infoCardCopy}>
                  <h3 className={mvpStyles.infoCardTitle}>{card.title}</h3>
                  <p className={mvpStyles.infoCardDescription}>
                    {card.description.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>
      <ProcessSection order="04" paddingTop={104} />
      <ServicePortfolioSection
        contentNodeId="291:55618"
        label="MVP 포트폴리오"
        order="05"
        portfolioType="mvp"
        title="MVP 개발 사례"
      />
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
