import Image from "next/image";
import type { CSSProperties } from "react";

import { partnerLogos } from "./partner-logos";
import styles from "./ProofPartnerLogoBanner.module.css";

const proofPartnerLogos = partnerLogos.filter(({ alt }) =>
  ["토스페이먼츠", "나이스페이", "고양특례시"].some((name) =>
    alt.includes(name),
  ),
);

export function ProofPartnerLogoBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={compact ? `${styles.root} ${styles.compact}` : styles.root}
      data-node-id="138:4612"
    >
      <p className={styles.title}>신뢰할 수 있는 파트너와 함께합니다</p>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <LogoGroup />
          <LogoGroup ariaHidden />
        </div>
      </div>
    </div>
  );
}

function LogoGroup({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className={styles.logoGroup}
    >
      {proofPartnerLogos.map((logo) => (
        <div
          className={styles.logoSlot}
          key={logo.alt}
          style={
            {
              "--proof-partner-logo-width": `${logo.width}px`,
            } as CSSProperties
          }
        >
          <Image
            alt={ariaHidden ? "" : logo.alt}
            className={styles.logo}
            height={logo.height}
            src={logo.src}
            width={logo.width}
          />
        </div>
      ))}
    </div>
  );
}
