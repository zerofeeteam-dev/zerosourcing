export const PORTFOLIO_SLUG = "e2e-raw-portfolio";
export const PORTFOLIO_SUPPORT_SLUG = "e2e-portfolio-null-thumbnail";
export const PORTFOLIO_TITLE = "E2E 원문 포트폴리오";
export const PORTFOLIO_SEO_DESCRIPTION =
  "실제 어드민에서 발행한 E2E 원문 포트폴리오 설명";

export const BLOG_SLUG = "e2e-wysiwyg-blog";
export const BLOG_TITLE = "E2E WYSIWYG 블로그";
export const BLOG_SUMMARY = "실제 에디터와 공개 sanitizer를 검증하는 카드 요약";
export const BLOG_SEO_DESCRIPTION =
  "실제 어드민에서 발행한 E2E WYSIWYG 블로그 설명";
export const BLOG_HEADING = "E2E 구조화 본문 제목";
export const BLOG_BOLD_TEXT = "굵게 작성한 핵심 문장";
export const BLOG_LINK_TEXT = "검증용 외부 링크";
export const BLOG_LINK_URL = "https://example.com/e2e-managed-content";
export const BLOG_LIST_ITEM_ONE = "첫 번째 검증 항목";
export const BLOG_LIST_ITEM_TWO = "두 번째 검증 항목";
export const BLOG_IMAGE_ALT = "E2E 본문 WEBP 기능 화면";
export const SANITIZED_MARKER = "SANITIZER_E2E_MARKER";

export const BLOG_SUPPORT_ROWS = [
  {
    publishedAt: "2098-01-04T00:00:00.000Z",
    slug: "e2e-blog-support-four",
    title: "E2E 목록 지원 4",
  },
  {
    publishedAt: "2098-01-03T00:00:00.000Z",
    slug: "e2e-blog-support-three",
    title: "E2E 목록 지원 3",
  },
  {
    publishedAt: "2098-01-02T00:00:00.000Z",
    slug: "e2e-blog-support-two",
    title: "E2E 목록 지원 2",
  },
  {
    publishedAt: "2098-01-01T00:00:00.000Z",
    slug: "e2e-blog-support-one",
    title: "E2E 목록 지원 1",
  },
] as const;

export const PORTFOLIO_SLUGS = [
  PORTFOLIO_SLUG,
  PORTFOLIO_SUPPORT_SLUG,
] as const;
export const BLOG_SLUGS = [
  BLOG_SLUG,
  ...BLOG_SUPPORT_ROWS.map((row) => row.slug),
] as const;

export const RAW_PORTFOLIO_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <style>
      html, body { margin: 0; padding: 0; }
      body { color: #111827; font-family: sans-serif; }
      #e2e-shell { padding: 24px; }
      #e2e-late-image { display: block; height: 1px; width: 1px; }
      #e2e-late-image:not([src]) { visibility: hidden; }
    </style>
  </head>
  <body>
    <article id="e2e-shell">
      <h2>E2E 원문 격리 렌더링</h2>
      <p id="e2e-raw-marker">관리자 미리보기와 공개 상세가 같은 원문을 사용합니다.</p>
      <img id="e2e-late-image" alt="늦게 로드되는 검증 이미지">
    </article>
    <script>
      document.documentElement.dataset.e2eScript = "ran";
      try {
        window.top.document.body.dataset.rawFrameEscaped = "true";
        document.documentElement.dataset.parentRead = "allowed";
      } catch {
        document.documentElement.dataset.parentRead = "blocked";
      }
      try {
        window.top.location.href = "https://example.invalid/e2e-top-navigation";
        document.documentElement.dataset.topNavigation = "allowed";
      } catch {
        document.documentElement.dataset.topNavigation = "blocked";
      }
      if (document.fonts) {
        document.fonts.ready.then(() => {
          document.documentElement.dataset.fontsReady = "resolved";
        });
      }
    </script>
  </body>
</html>
`;

export const WEBP_UPLOAD = {
  buffer: Buffer.from(
    "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",
    "base64",
  ),
  mimeType: "image/webp",
  name: "e2e-feature.webp",
} as const;

export const LATE_IMAGE_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='640'%3E%3Crect width='1' height='640' fill='%23dbeafe'/%3E%3C/svg%3E";
