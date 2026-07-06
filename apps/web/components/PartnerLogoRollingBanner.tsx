import Image from "next/image";
import type { CSSProperties } from "react";

import styles from "./PartnerLogoRollingBanner.module.css";

export type PartnerLogo = {
  alt: string;
  height: number;
  src: string;
  width: number;
};

type PartnerLogoRollingBannerProps = {
  logos: PartnerLogo[];
  title?: string;
};

export function PartnerLogoRollingBanner({
  logos,
  title,
}: PartnerLogoRollingBannerProps) {
  return (
    <div className={styles.root}>
      {title ? <p className={styles.title}>{title}</p> : null}
      <div className={styles.viewport}>
        <div className={styles.track}>
          <LogoGroup logos={logos} />
          <LogoGroup ariaHidden logos={logos} />
        </div>
      </div>
    </div>
  );
}

type LogoGroupProps = {
  ariaHidden?: boolean;
  logos: PartnerLogo[];
};

function LogoGroup({ ariaHidden, logos }: LogoGroupProps) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className={styles.logoGroup}
    >
      {logos.map((logo) => (
        <div
          className={styles.logoSlot}
          key={logo.alt}
          style={
            {
              "--partner-logo-width": `${logo.width}px`,
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
