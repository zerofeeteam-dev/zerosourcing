import { SITE_URL } from "../../app/site-metadata";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const organizationReference = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "제로소싱",
  url: SITE_URL,
} as const;

type ServiceJsonLdInput = {
  readonly description: string;
  readonly name: string;
  readonly path: string;
  readonly serviceType: string;
};

type BlogPostingJsonLdInput = {
  readonly category: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly publishedDate: string;
  readonly slug: string;
  readonly title: string;
  readonly updatedAt: string;
};

type BreadcrumbItem = {
  readonly name: string;
  readonly path: string;
};

type BreadcrumbItems = readonly [
  BreadcrumbItem,
  BreadcrumbItem,
  ...BreadcrumbItem[],
];

function createSiteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function createServiceJsonLd({
  description,
  name,
  path,
  serviceType,
}: ServiceJsonLdInput) {
  const url = createSiteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    areaServed: {
      "@type": "Country",
      name: "대한민국",
    },
    description,
    name,
    provider: organizationReference,
    serviceType,
    url,
  } as const;
}

export function createBreadcrumbJsonLd(items: BreadcrumbItems) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem",
      item: createSiteUrl(path),
      name,
      position: index + 1,
    })),
  } as const;
}

export function createBlogPostingJsonLd({
  category,
  description,
  imageUrl,
  publishedDate,
  slug,
  title,
  updatedAt,
}: BlogPostingJsonLdInput) {
  const url = createSiteUrl(`/blog/${slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blog-posting`,
    articleSection: category,
    author: organizationReference,
    dateModified: updatedAt,
    datePublished: publishedDate,
    description,
    headline: title,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    inLanguage: "ko-KR",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    publisher: organizationReference,
    url,
  } as const;
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
