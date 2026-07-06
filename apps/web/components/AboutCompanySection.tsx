import { SectionShell } from "./SectionShell";
import styles from "./AboutCompanySection.module.css";

const companyInfo = [
  ["상호", "제로피(제로소싱)"],
  ["대표자", "이동규"],
  ["사업자등록번호", "487-28-01888"],
  ["통신판매업신고", "2026-고양덕양구-1043"],
  [
    "주소",
    "경기도 고양시 덕양구 동축로70, A동 9층 901호(동산동, 현대프리미어캠퍼스)",
  ],
  ["이메일", "contact@zerofee.kr"],
  ["전화", "02-1234-5678"],
  ["고객 문의", "카카오톡 채널 @zerosourcing"],
] as const;

const officeName = "제로피(제로소싱)";
const officeAddress =
  "경기도 고양시 덕양구 동축로70, A동 9층 901호(동산동, 현대프리미어캠퍼스)";
const officeMapQuery = encodeURIComponent(
  "제로피 제로소싱 경기도 고양시 덕양구 동축로70 A동 9층 901호",
);
const googleMapsEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
const officeMapEmbedUrl = googleMapsEmbedKey
  ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsEmbedKey}&q=${officeMapQuery}&zoom=16&language=ko&region=kr`
  : null;

export function AboutCompanySection() {
  return (
    <SectionShell
      description="언제든 편하게 연락 주세요. 상담은 메일·전화·카카오톡 어느 쪽이든 좋습니다."
      label="회사 정보"
      order="05"
      title="제로소싱은 여기 있습니다"
    >
      <div className={styles.grid} data-node-id="20:1376">
        <dl className={styles.infoList}>
          {companyInfo.map(([label, value]) => (
            <div className={styles.infoRow} key={label}>
              <dt className={styles.infoLabel}>{label}</dt>
              <dd className={styles.infoValue}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.mapCard}>
          {officeMapEmbedUrl ? (
            <iframe
              allowFullScreen
              aria-label="제로소싱 사무실 위치"
              className={styles.mapFrame}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              src={officeMapEmbedUrl}
              tabIndex={-1}
            />
          ) : (
            <div
              aria-label="제로소싱 사무실 위치"
              className={`${styles.mapFrame} ${styles.mapLink}`}
            >
              Google Maps 연동 준비 중
            </div>
          )}
          <div className={styles.mapInfo}>
            <p className={styles.officeName}>{officeName}</p>
            <p className={styles.officeAddress}>{officeAddress}</p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
