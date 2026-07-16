"use client";

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@repo/ui/button";

import { Icon } from "./Icon";
import { emitCtaClick } from "./cta-events";
import styles from "./BottomFloatingCta.module.css";

const ctaButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
} satisfies CSSProperties;

function shouldShowBottomFloatingCta(pathname: string) {
  if (pathname === "/" || pathname === "/faq") {
    return true;
  }

  return pathname === "/portfolio" || pathname.startsWith("/portfolio/");
}

export function BottomFloatingCta() {
  const pathname = usePathname();

  if (!shouldShowBottomFloatingCta(pathname)) {
    return null;
  }

  return (
    <aside
      aria-label="간편 문의"
      className={styles.root}
      data-bottom-floating-cta="visible"
      data-node-id="28:2584"
    >
      <div className={styles.surface}>
        <p className={styles.label}>지금 바로 시작하세요</p>
        <Button
          className={styles.button}
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
    </aside>
  );
}
