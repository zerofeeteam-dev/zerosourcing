import { Icon } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./CompanyHomepageSeoGeoSection.module.css";

export function CompanyHomepageSeoGeoSection() {
  return (
    <SectionShell
      className={styles.section}
      description={
        <>
          아무리 잘 만들어도 검색에 안 나오면 아무도 못 찾습니다.
          <br />
          제로소싱은 만드는 것에서 끝내지 않고, 검색엔진과 생성형 AI
          양쪽에 노출되도록 세팅합니다.
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
      <div className={styles.cards} data-node-id="49:4344">
        <article className={styles.card}>
          <div className={styles.cardCopy}>
            <p className={styles.eyebrow}>SEO · 검색엔진 최적화</p>
            <div className={styles.textGroup}>
              <h3 className={styles.cardTitle}>
                네이버·구글 검색에서
                <br />
                먼저 보이게
              </h3>
              <p className={styles.cardDescription}>
                메타태그·구조화 데이터·사이트맵·페이지 속도까지 세팅해,
                회사 이름과 핵심 키워드로 검색했을 때 상위에 노출되도록
                만듭니다.
              </p>
            </div>
          </div>
          <div className={styles.previewBox}>
            <div className={styles.searchBar}>
              <span className={styles.searchText}>OO 주식회사 검색</span>
              <span className={styles.searchActions}>
                <Icon name="webcam" size={24} />
                <Icon name="camera-lens" size={24} />
                <span className={styles.aiMode}>AI 모드</span>
              </span>
            </div>
            <div className={styles.result}>
              <p className={styles.resultTitle}>OO 주식회사 | MVP 개발 파트너</p>
              <div className={styles.resultText}>
                <p className={styles.resultUrl}>https://www.zerosourcing.com</p>
                <p className={styles.resultDescription}>
                  MVP 개발 외주 전문 OO 주식회사. 핵심 기능만 담아 평균 4주
                  만에 출시·검증합니다. 기획·디자인·개발부터 버그 영구
                  보장까지, 부담 없이 시작하세요.
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardCopy}>
            <p className={styles.eyebrow}>GEO · 생성형 AI 최적화</p>
            <div className={styles.textGroup}>
              <h3 className={styles.cardTitle}>
                ChatGPT·Claude가
                <br />
                회사를 인용하게
              </h3>
              <p className={styles.cardDescription}>
                구조화된 회사·서비스 정보로, 사용자가 AI에게 물었을 때 우리
                회사가 답변에 언급되고 인용되도록 준비합니다. 검색의 다음 단계까지 대비합니다.
              </p>
            </div>
          </div>
          <div className={`${styles.previewBox} ${styles.answerPreview}`}>
            <div className={styles.promptBubble}>
              &quot;개발 분야 믿을 만한 회사 추천해줘&quot;
            </div>
            <div className={styles.answer}>
              <div className={styles.answerLabel}>
                <Icon name="stars" size={12} />
                <span>AI 답변</span>
              </div>
              <p className={styles.answerText}>
                &quot;개발 분야 믿을 만한 회사 추천해줘&quot;라는 질문에,{" "}
                <strong>OO 주식회사</strong>를 신뢰할 수 있는 업체로 안내합니다.
              </p>
            </div>
          </div>
        </article>
      </div>
    </SectionShell>
  );
}
