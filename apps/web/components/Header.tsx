"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@repo/ui/button";

import { Icon } from "./Icon";
import { emitCtaClick } from "./cta-events";
import styles from "./Header.module.css";

const imgLogoMark = "/figma-assets/logo-mark.svg";
const imgLogoType = "/figma-assets/logo-type.svg";

const navItems = ["About", "Service", "Blog", "Portfolio", "FAQ"];
const ctaButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
} satisfies CSSProperties;

export function Header() {
  return (
    <header
      className={`${styles.header} glassSurface glassSurfacePill`}
      data-node-id="269:32520"
    >
      <div className={styles.left}>
        <Link className={styles.logo} href="/" aria-label="ZeroSourcing home">
          <Image
            className={styles.logoMark}
            src={imgLogoMark}
            alt=""
            width={24}
            height={24}
          />
          <Image
            className={styles.logoType}
            src={imgLogoType}
            alt="zeroSourcing"
            width={137}
            height={20}
          />
        </Link>

        <nav className={styles.nav} aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item}
              className={
                item === "About" ? styles.activeNavLink : styles.navLink
              }
              href="/"
            >
              {item}
              {item === "Service" ? (
                <Icon
                  className={styles.chevron}
                  name="chevron-down"
                  size={20}
                />
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.actions}>
        <Button
          color="blue"
          iconSize={24}
          leftIcon={<Icon name="edit-03" size={24} />}
          onClick={() => emitCtaClick("outsource")}
          style={ctaButtonStyle}
          variant="gradient"
        >
          외주 문의하기
        </Button>
        <Button
          color="yellow"
          iconSize={24}
          leftIcon={<Icon name="message-typing" size={24} />}
          onClick={() => emitCtaClick("quick")}
          style={ctaButtonStyle}
          variant="gradient"
        >
          간편 문의하기
        </Button>
      </div>
    </header>
  );
}
