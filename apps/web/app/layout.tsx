import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./glass.css";
import "../../../design-system.css";
import "@repo/content/rich-content.css";
import { BottomFloatingCta } from "../components/BottomFloatingCta";
import { JsonLd } from "../components/JsonLd";
import { MetaPixel } from "../components/MetaPixel";
import organizationJsonLd from "./organization-json-ld.json";
import {
  createPageMetadata,
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_URL,
} from "./site-metadata";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    other: {
      "naver-site-verification":
        "1354aa7def5f9d3e6c769cc5e78353b63a60a7b5",
    },
  },
  ...createPageMetadata({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <JsonLd data={organizationJsonLd} id="organization-json-ld" />
        {children}
        <BottomFloatingCta />
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
      </body>
    </html>
  );
}
