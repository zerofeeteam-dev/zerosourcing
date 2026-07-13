"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@repo/ui/button";

import { Icon } from "./Icon";
import { emitCtaClick } from "./cta-events";
import {
  ensureGlassFilter,
  supportsGlassRefraction,
} from "./glassFilter";
import styles from "./Header.module.css";

const imgLogo = "/figma-icons/ZerosourcingLogo.svg";

const navItems = [
  { href: "/about", label: "About" },
  { href: "/service/mvp", label: "Service" },
  { href: "/blog", label: "Blog" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/faq", label: "FAQ" },
];
const serviceItems = [
  { href: "/service/mvp", label: "MVP 개발" },
  { href: "/service/app", label: "어플리케이션 개발" },
  { href: "/service/company-homepage", label: "기업 홈페이지" },
];
const ctaButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
} satisfies CSSProperties;

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMenuOpen(false);

  useLayoutEffect(() => {
    const element = headerRef.current;
    if (!element || !supportsGlassRefraction()) return;

    let timer = 0;
    const updateFilter = () => {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      if (!width || !height) return;

      const filterId = ensureGlassFilter({
        width,
        height,
        radius: height / 2,
        bezel: 18,
        scale: 54,
      });
      const filter = `blur(8px) url("#${filterId}") saturate(1.5)`;
      element.style.backdropFilter = filter;
      (
        element.style as CSSStyleDeclaration & {
          webkitBackdropFilter?: string;
        }
      ).webkitBackdropFilter = filter;
    };
    const scheduleUpdate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(updateFilter, 120);
    };

    updateFilter();
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(element);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <header
        className={styles.header}
        data-node-id="269:32520"
        ref={headerRef}
      >
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
              const isServiceItem = item.label === "Service";
              const isActive = isServiceItem
                ? pathname.startsWith("/service")
                : item.href === "/blog"
                  ? pathname.startsWith("/blog")
                  : item.href !== "/" && pathname === item.href;
              const navLink = (
                <Link
                  aria-haspopup={isServiceItem ? "menu" : undefined}
                  className={isActive ? styles.activeNavLink : styles.navLink}
                  href={item.href}
                >
                  {item.label}
                  {isServiceItem ? (
                    <Icon
                      className={styles.chevron}
                      name="chevron-down"
                      size={20}
                    />
                  ) : null}
                </Link>
              );

              if (!isServiceItem) {
                return <span key={item.label}>{navLink}</span>;
              }

              return (
                <div className={styles.serviceNavItem} key={item.label}>
                  {navLink}
                  <div className={styles.serviceDropdown} data-node-id="14:1287">
                    {serviceItems.map((serviceItem) => (
                      <Link
                        className={
                          pathname === serviceItem.href
                            ? styles.activeServiceDropdownItem
                            : styles.serviceDropdownItem
                        }
                        href={serviceItem.href}
                        key={serviceItem.href}
                      >
                        {serviceItem.label}
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
          <div className={styles.mobileMenuGroup} key={item.label}>
            <Link
              className={styles.mobileMenuItem}
              href={item.href}
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
            {item.label === "Service"
              ? serviceItems.map((serviceItem) => (
                  <Link
                    className={`${styles.mobileMenuItem} ${styles.mobileServiceItem}`}
                    href={serviceItem.href}
                    key={serviceItem.href}
                    onClick={closeMobileMenu}
                  >
                    {serviceItem.label}
                  </Link>
                ))
              : null}
          </div>
        ))}
      </nav>
    </>
  );
}
