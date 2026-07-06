import Image from "next/image";

import styles from "./Footer.module.css";

const logoSrc = "/figma-icons/ZerosourcingLogo.svg";

const customerLines = [
  "고객센터",
  "전화번호 : 010-3242-8118",
  "주중 09~18시 (점심시간 12~13시 30분 / 주말 및 공휴일 제외)",
];

export function Footer() {
  return (
    <footer className={styles.footer} data-node-id="138:5122">
      <div className={styles.inner}>
        <Image
          alt="zeroSourcing"
          className={styles.logo}
          height={24}
          src={logoSrc}
          width={167}
        />

        <span aria-hidden="true" className={styles.divider} />

        <div className={styles.policyGroup}>
          <p>이용약관</p>
          <p className={styles.bold}>개인정보처리방침</p>
          <div className={styles.customerGroup}>
            {customerLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <span aria-hidden="true" className={styles.divider} />

        <div className={styles.companyGroup}>
          <p className={styles.desktopOnly}>
            제로피(제로소싱) | 사업자등록번호 : 487-28-01888 | 대표 : 이동규
          </p>
          <p className={styles.mobileOnly}>제로피(제로소싱)</p>
          <p className={styles.mobileOnly}>사업자등록번호 : 487-28-01888</p>
          <p className={styles.mobileOnly}>대표 : 이동규</p>

          <p className={styles.desktopOnly}>
            주소 : 경기도 고양시 덕양구 동축로70, A동 9층 901호(동산동,
            현대프리미어캠퍼스)
          </p>
          <div className={styles.mobileAddress}>
            <p>주소 : 경기도 고양시 덕양구 동축로70, A동 9층 901호</p>
            <p>(동산동, 현대프리미어캠퍼스)</p>
          </div>

          <p className={styles.desktopOnly}>
            개인정보처리담당자 : 이동규 | 통신판매업신고번호 :
            2026-고양덕양구-1043
          </p>
          <p className={styles.mobileOnly}>개인정보처리담당자 : 이동규</p>
          <p className={styles.mobileOnly}>
            통신판매업신고번호 : 2026-고양덕양구-1043
          </p>
          <p>메일 : contact@zerofee.kr</p>
          <p className={styles.bold}>
            Copyright ⓒ 2026 zerofee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
