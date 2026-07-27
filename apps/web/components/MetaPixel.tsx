"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

import {
  META_PIXEL_BOOTSTRAP_SCRIPT,
  META_PIXEL_NOSCRIPT_URL,
  trackMetaPageView,
} from "../lib/meta-pixel";

export function MetaPixel() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isReady || previousPathname.current === pathname) return;

    if (trackMetaPageView()) {
      previousPathname.current = pathname;
    }
  }, [isReady, pathname]);

  return (
    <>
      <Script
        id="meta-pixel-bootstrap"
        onReady={() => setIsReady(true)}
        strategy="afterInteractive"
      >
        {META_PIXEL_BOOTSTRAP_SCRIPT}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's no-JavaScript tracking fallback must request its endpoint directly. */}
        <img
          alt=""
          height="1"
          src={META_PIXEL_NOSCRIPT_URL}
          style={{ display: "none" }}
          width="1"
        />
      </noscript>
    </>
  );
}
