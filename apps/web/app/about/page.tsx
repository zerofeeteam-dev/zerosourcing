import { BottomCtaBanner } from "../../components/BottomCtaBanner";
import { BusinessTypesSection } from "../../components/BusinessTypesSection";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { Icon } from "../../components/Icon";
import { ProofPartnerLogoBanner } from "../../components/ProofPartnerLogoBanner";
import { ProofMetrics } from "../../components/ProofMetrics";
import { SectionShell } from "../../components/SectionShell";
import { VideoBanner } from "../../components/VideoBanner";
import { createPageMetadata } from "../site-metadata";
import {
  aboutCompanyInfoRows,
  aboutHowItems,
  aboutOffice,
  aboutPrinciples,
  aboutProofMetrics,
} from "./content";
import aboutStyles from "./page.module.css";
import styles from "../page.module.css";

export const metadata = createPageMetadata({
  title: "제로소싱 | MVP 개발 외주 전문 팀 회사소개",
  description:
    "제로소싱은 목적에 맞는 가장 빠른 방법으로, 때로는 AI를 활용해 더 가볍게 MVP를 만드는 개발 외주 팀입니다. 부담은 덜고 출시는 앞당기는 제로소싱의 일하는 방식과 철학을 소개합니다.",
  path: "/about",
});

const officeMapQuery = encodeURIComponent(aboutOffice.mapQuery);
const googleMapsEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
const officeMapEmbedUrl = googleMapsEmbedKey
  ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsEmbedKey}&q=${officeMapQuery}&zoom=16&language=ko&region=kr`
  : null;

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
      <SectionShell
        className={aboutStyles.aboutIntroSection}
        description={
          <>
            <span className={aboutStyles.descriptionBlock}>
              좋은 아이디어가 개발자를 구하지 못해 멈추고, 합리적인 검증이 비싼
              견적과 긴 일정에 가로막히는 일을 자주 봅니다.
              <br />
              제로소싱은 그 사이의 거리를 줄이려고 만들어졌습니다.
            </span>
            <span className={aboutStyles.descriptionBlock}>
              아이디어가 있다면, 누구나 빠르게 세상에 내놓을 수 있어야 한다고
              믿습니다.
              <br />
              그래서 우리는 &apos;무엇을 더 넣을지&apos;가 아니라 &apos;무엇을
              빼도 되는지&apos;부터 함께 정하고, 검증에 꼭 필요한 핵심만 가장
              빠른 방법으로 만듭니다.
              <br />
              때로는 그 방법이 AI를 활용하는 것이기도 합니다.
            </span>
          </>
        }
        label="제로소싱의 시작"
        order="01"
        title={
          <>
            아이디어와 출시 사이,
            <br />그 거리를 좁힙니다
          </>
        }
      >
        <div className={aboutStyles.quote} data-node-id="20:788">
          <Icon
            className={aboutStyles.quoteIcon}
            height={8}
            name="quote-left"
            width={9}
          />
          <p className={aboutStyles.quoteText}>
            <span>아이디어와 현실 사이의 거리를,</span>
            <strong className={aboutStyles.highlight}>가장 짧게.</strong>
          </p>
          <Icon
            className={`${aboutStyles.quoteIcon} ${aboutStyles.quoteIconEnd}`}
            height={8}
            name="quote-left"
            width={9}
          />
        </div>
      </SectionShell>
      <SectionShell
        className={aboutStyles.aboutPrinciplesSection}
        description="기술보다 먼저인 태도가 결과를 만든다고 믿습니다."
        label="일하는 방식"
        order="02"
        title="우리가 지키는 다섯 가지"
      >
        <div className={aboutStyles.timeline} data-node-id="20:1682">
          <span aria-hidden="true" className={aboutStyles.axis} />
          {aboutPrinciples.map((principle) => (
            <div className={aboutStyles.item} key={principle.id}>
              <div className={aboutStyles.marker}>
                <span className={aboutStyles.number}>{principle.id}</span>
                <span aria-hidden="true" className={aboutStyles.shape} />
              </div>
              <div className={aboutStyles.aboutPrinciplesCopy}>
                <p className={aboutStyles.itemTitle}>{principle.title}</p>
                <p className={aboutStyles.itemDescription}>
                  {principle.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>
      <SectionShell
        description="비결은 특별한 도구 하나가 아니라, 목적에 맞는 방법을 고르는 유연함입니다."
        label="왜 제로소싱일까요"
        order="03"
        title={
          <>
            어떻게 더 빠르고,
            <br />더 가벼울까요?
          </>
        }
      >
        <div className={aboutStyles.content} data-node-id="20:861">
          <div className={aboutStyles.cardGrid} data-node-id="20:896">
            {aboutHowItems.map((item) => (
              <article className={aboutStyles.card} key={item.eyebrow}>
                <p className={aboutStyles.eyebrow}>{item.eyebrow}</p>
                <div className={aboutStyles.aboutHowCopy}>
                  <h3 className={aboutStyles.cardTitle}>{item.title}</h3>
                  <p className={aboutStyles.cardDescription}>
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <ProofMetrics items={aboutProofMetrics} />
        </div>
      </SectionShell>
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
      <SectionShell
        description="언제든 편하게 연락 주세요. 상담은 메일·전화·카카오톡 어느 쪽이든 좋습니다."
        label="회사 정보"
        order="05"
        title="제로소싱은 여기 있습니다"
      >
        <div className={aboutStyles.grid} data-node-id="20:1376">
          <dl className={aboutStyles.infoList}>
            {aboutCompanyInfoRows.map(([label, value]) => (
              <div className={aboutStyles.infoRow} key={label}>
                <dt className={aboutStyles.infoLabel}>{label}</dt>
                <dd className={aboutStyles.infoValue}>{value}</dd>
              </div>
            ))}
          </dl>
          <div className={aboutStyles.mapCard}>
            {officeMapEmbedUrl ? (
              <iframe
                allowFullScreen
                aria-label="제로소싱 사무실 위치"
                className={aboutStyles.mapFrame}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src={officeMapEmbedUrl}
                tabIndex={-1}
              />
            ) : (
              <div
                aria-label="제로소싱 사무실 위치"
                className={`${aboutStyles.mapFrame} ${aboutStyles.mapLink}`}
              >
                Google Maps 연동 준비 중
              </div>
            )}
            <div className={aboutStyles.mapInfo}>
              <p className={aboutStyles.officeName}>{aboutOffice.name}</p>
              <p className={aboutStyles.officeAddress}>{aboutOffice.address}</p>
            </div>
          </div>
        </div>
      </SectionShell>
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
