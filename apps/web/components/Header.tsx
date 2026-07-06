"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@repo/ui/button";

import { Icon } from "./Icon";
import { emitCtaClick } from "./cta-events";
import styles from "./Header.module.css";

const imgLogo = "/figma-icons/ZerosourcingLogo.svg";

const navItems = ["About", "Service", "Blog", "Portfolio", "FAQ"];
const serviceItems = ["MVP 개발", "어플리케이션 개발", "기업 홈페이지"];
const ctaButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
} satisfies CSSProperties;

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header
        className={`${styles.header} glassSurface glassSurfacePill glassSurfaceGradientBorder glassSurfaceLiquid`}
        data-node-id="269:32520"
      >
        <div aria-hidden className="glassLiquidEffect" />
        <div className={styles.left}>
          <Link className={styles.logo} href="/" aria-label="ZeroSourcing home">
            <Image
              className={styles.logoImage}
              src={imgLogo}
              alt="zeroSourcing"
              width={168}
              height={24}
            />
          </Link>

          <nav className={styles.nav} aria-label="Primary navigation">
            {navItems.map((item) => {
              const navLink = (
                <Link
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
              );

              if (item !== "Service") {
                return <span key={item}>{navLink}</span>;
              }

              return (
                <div className={styles.serviceNavItem} key={item}>
                  {navLink}
                  <div
                    className={`${styles.serviceDropdown} glassSurface glassSurfaceGradientBorder`}
                    data-node-id="14:1287"
                  >
                    {serviceItems.map((serviceItem, index) => (
                      <Link
                        className={
                          index === 0
                            ? styles.activeServiceDropdownItem
                            : styles.serviceDropdownItem
                        }
                        href="/"
                        key={serviceItem}
                      >
                        {serviceItem}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
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

        <button
          aria-controls="mobile-header-menu"
          aria-expanded={isMenuOpen}
          className={styles.menuButton}
          onClick={() => setIsMenuOpen(true)}
          type="button"
          aria-label="메뉴 열기"
        >
          <Icon name="menu-01" size={24} />
        </button>
      </header>

      <svg aria-hidden style={{ display: "none" }}>
        <filter
          id="glass-distortion"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves="1"
            seed="5"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="150"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <nav
        aria-hidden={!isMenuOpen}
        aria-label="Mobile navigation"
        className={styles.mobileMenu}
        data-node-id="15:4143"
        data-open={isMenuOpen}
        id="mobile-header-menu"
      >
        <button
          className={`${styles.mobileMenuItem} ${styles.mobileCloseButton}`}
          onClick={closeMobileMenu}
          type="button"
          aria-label="메뉴 닫기"
        >
          <Icon name="x-03" size={24} />
        </button>
        {navItems.map((item) => (
          <div className={styles.mobileMenuGroup} key={item}>
            <Link
              className={styles.mobileMenuItem}
              href="/"
              onClick={closeMobileMenu}
            >
              {item}
            </Link>
            {item === "Service"
              ? serviceItems.map((serviceItem) => (
                  <Link
                    className={`${styles.mobileMenuItem} ${styles.mobileServiceItem}`}
                    href="/"
                    key={serviceItem}
                    onClick={closeMobileMenu}
                  >
                    {serviceItem}
                  </Link>
                ))
              : null}
          </div>
        ))}
      </nav>
    </>
  );
}
