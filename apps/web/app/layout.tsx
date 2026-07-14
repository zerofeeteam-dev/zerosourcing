import type { Metadata } from "next";
import "./globals.css";
import "../../../design-system.css";
import "@repo/content/rich-content.css";
import organizationJsonLd from "./organization-json-ld.json";
import {
  createPageMetadata,
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_URL,
} from "./site-metadata";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...createPageMetadata({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
  }),
};

const organizationJsonLdString = JSON.stringify(organizationJsonLd).replace(
  /</g,
  "\\u003c",
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: organizationJsonLdString }}
          id="organization-json-ld"
          type="application/ld+json"
        />
        {children}
      </body>
    </html>
  );
}
