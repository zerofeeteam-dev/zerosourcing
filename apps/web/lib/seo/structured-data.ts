import { SITE_URL } from "../../app/site-metadata";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const organizationReference = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "제로소싱",
  url: SITE_URL,
} as const;

const websiteReference = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
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

type FaqPageJsonLdInput = {
  readonly faqs: readonly {
    readonly answer: string;
    readonly question: string;
  }[];
  readonly name: string;
  readonly path: string;
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

export function createWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    inLanguage: "ko-KR",
    name: "제로소싱",
    publisher: organizationReference,
    url: SITE_URL,
  } as const;
}

export function createFaqPageJsonLd({
  faqs,
  name,
  path,
}: FaqPageJsonLdInput) {
  const url = createSiteUrl(path);
  const uniqueFaqs = [
    ...new Map(faqs.map((faq) => [faq.question, faq])).values(),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    inLanguage: "ko-KR",
    isPartOf: websiteReference,
    mainEntity: uniqueFaqs.map(({ answer, question }) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
      name: question,
    })),
    name,
    url,
  } as const;
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
