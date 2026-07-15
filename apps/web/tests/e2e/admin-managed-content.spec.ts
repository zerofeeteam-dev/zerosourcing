import {
  expect,
  test,
  type APIRequestContext,
  type Frame,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildRawHtmlSource } from "@repo/content/raw-html-frame";

import {
  cleanupE2EContent,
  isCanonicalE2EThumbnailPath,
} from "./content-cleanup";
import {
  BLOG_BOLD_TEXT,
  BLOG_HEADING,
  BLOG_IMAGE_ALT,
  BLOG_LINK_TEXT,
  BLOG_LINK_URL,
  BLOG_LIST_ITEM_ONE,
  BLOG_LIST_ITEM_TWO,
  BLOG_SEO_DESCRIPTION,
  BLOG_SLUG,
  BLOG_SUMMARY,
  BLOG_SUPPORT_ROWS,
  BLOG_TITLE,
  LATE_IMAGE_DATA_URL,
  PORTFOLIO_SEO_DESCRIPTION,
  PORTFOLIO_SLUG,
  PORTFOLIO_SUPPORT_SLUG,
  PORTFOLIO_TITLE,
  RAW_PORTFOLIO_HTML,
  SANITIZED_MARKER,
  WEBP_UPLOAD,
} from "./content-fixtures";
import {
  ADMIN_URL,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  LOCAL_SUPABASE_URL,
  WEB_URL,
} from "./environment";
import { createLocalServiceClient } from "./service-client";

type PortfolioDatabaseRow = {
  readonly content: string;
  readonly content_asset_scope: string;
  readonly content_authoring_mode: string;
  readonly deleted_at: string | null;
  readonly landing_published: boolean;
  readonly service_published: boolean;
  readonly status: string;
  readonly thumbnail_public_url: string | null;
};

type BlogDatabaseRow = {
  readonly content: string;
  readonly content_asset_scope: string;
  readonly content_authoring_mode: string;
  readonly content_json: unknown;
  readonly deleted_at: string | null;
  readonly landing_published: boolean;
  readonly banner_published: boolean;
  readonly status: string;
  readonly thumbnail_public_url: string | null;
};

const localStoragePublicBase = `${LOCAL_SUPABASE_URL}/storage/v1/object/public/zerosourcing`;

function freshUrl(path: string): string {
  const url = new URL(path, WEB_URL);
  url.searchParams.set("e2e", `${Date.now()}-${crypto.randomUUID()}`);
  return url.toString();
}

async function gotoFresh(page: Page, path: string): Promise<void> {
  await page.goto(freshUrl(path), { waitUntil: "domcontentloaded" });
}

function publicLink(root: Page | Locator, path: string): Locator {
  return root.locator(`a[href="${path}"]`);
}

async function expectVisibleMatches(
  locator: Locator,
  count: number,
): Promise<void> {
  await expect(locator).toHaveCount(count);
  for (let index = 0; index < count; index += 1) {
    await expect(locator.nth(index)).toBeVisible();
  }
}

async function expectLoadedImageDimensions(
  image: Locator,
  width: number,
  height: number,
): Promise<void> {
  await expect
    .poll(() =>
      image.evaluate((element) => {
        const loadedImage = element as HTMLImageElement;
        return {
          complete: loadedImage.complete,
          height: loadedImage.naturalHeight,
          width: loadedImage.naturalWidth,
        };
      }),
    )
    .toEqual({ complete: true, height, width });
}

async function responseText(
  request: APIRequestContext,
  path: string,
): Promise<{ readonly status: number; readonly text: string }> {
  const response = await request.get(freshUrl(path), {
    headers: { "cache-control": "no-store" },
  });
  return { status: response.status(), text: await response.text() };
}

async function sitemapText(request: APIRequestContext): Promise<string> {
  const response = await responseText(request, "/sitemap.xml");
  expect(response.status).toBe(200);
  return response.text;
}

async function loginThroughAdmin(page: Page): Promise<void> {
  await page.goto(`${ADMIN_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("이메일").fill(E2E_ADMIN_EMAIL);
  await page.getByLabel("비밀번호").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(`${ADMIN_URL}/portfolio`);
  await expect(
    page.getByRole("heading", { name: "포트폴리오 등록 현황" }),
  ).toBeVisible();
}

async function portfolioRow(
  client: SupabaseClient,
): Promise<PortfolioDatabaseRow> {
  const { data, error } = await client
    .from("portfolios")
    .select(
      "status,content_authoring_mode,content,content_asset_scope,thumbnail_public_url,landing_published,service_published,deleted_at",
    )
    .eq("slug", PORTFOLIO_SLUG)
    .single();
  if (error) throw error;
  return data as PortfolioDatabaseRow;
}

async function portfolioExists(client: SupabaseClient): Promise<boolean> {
  const { data, error } = await client
    .from("portfolios")
    .select("slug")
    .eq("slug", PORTFOLIO_SLUG)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

async function blogRow(client: SupabaseClient): Promise<BlogDatabaseRow> {
  const { data, error } = await client
    .from("blog_posts")
    .select(
      "status,content_authoring_mode,content_json,content,content_asset_scope,thumbnail_public_url,landing_published,banner_published,deleted_at",
    )
    .eq("slug", BLOG_SLUG)
    .single();
  if (error) throw error;
  return data as BlogDatabaseRow;
}

async function updatePortfolioOrderingAndSeedSupport(
  client: SupabaseClient,
): Promise<void> {
  const { error: orderingError } = await client
    .from("portfolios")
    .update({ published_at: "2099-01-01T00:00:00.000Z" })
    .eq("slug", PORTFOLIO_SLUG);
  if (orderingError) throw orderingError;

  const { error: supportError } = await client.from("portfolios").insert({
    company_name: "E2E null thumbnail support",
    content: "<p>E2E 포트폴리오 필터 지원 본문</p>",
    content_authoring_mode: "raw_html",
    content_mode: "html",
    landing_published: false,
    product_description: "필터와 null thumbnail 검증용",
    published_at: "2098-01-01T00:00:00.000Z",
    service_published: false,
    slug: PORTFOLIO_SUPPORT_SLUG,
    status: "published",
    thumbnail_path: null,
    thumbnail_public_url: null,
    title: "E2E 기업 홈페이지 지원",
    type: "company_homepage",
  });
  if (supportError) throw supportError;
}

async function updateBlogOrderingAndSeedSupport(
  client: SupabaseClient,
): Promise<void> {
  const { error: orderingError } = await client
    .from("blog_posts")
    .update({ published_at: "2099-01-01T00:00:00.000Z" })
    .eq("slug", BLOG_SLUG);
  if (orderingError) throw orderingError;

  const supportRows = BLOG_SUPPORT_ROWS.map((row) => ({
    banner_published: false,
    content: `<p>${row.title} 관련 글 본문</p>`,
    content_authoring_mode: "raw_html",
    content_mode: "html",
    landing_published: false,
    published_at: row.publishedAt,
    published_date: "2026-07-15",
    slug: row.slug,
    status: "published",
    summary: `${row.title} 검색과 관련 글 검증 요약`,
    thumbnail_path: null,
    thumbnail_public_url: null,
    title: row.title,
    type: "mvp",
  }));
  const { error: supportError } = await client
    .from("blog_posts")
    .insert(supportRows);
  if (supportError) throw supportError;
}

async function setBlogContent(
  client: SupabaseClient,
  content: string,
): Promise<void> {
  const { error } = await client
    .from("blog_posts")
    .update({ content })
    .eq("slug", BLOG_SLUG);
  if (error) throw error;
}

function findImageNode(
  value: unknown,
): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Readonly<Record<string, unknown>>;
  if (record.type === "image") return record;
  if (!Array.isArray(record.content)) return null;

  for (const child of record.content) {
    const image = findImageNode(child);
    if (image) return image;
  }
  return null;
}

function contentImageSource(content: string): string {
  const source = /<img\b[^>]*\bsrc="([^"]+)"/u.exec(content)?.[1];
  if (!source) throw new Error("The Admin-generated Blog HTML has no image.");
  return source;
}

function expectStoredWysiwygBlog(
  row: BlogDatabaseRow,
  expectedImageUrl?: string,
): string {
  expect(row.content_authoring_mode).toBe("wysiwyg");
  expect(row.content).toContain(`<h2>${BLOG_HEADING}</h2>`);
  expect(row.content).toContain(`<strong>${BLOG_BOLD_TEXT}</strong>`);
  expect(row.content).toContain(BLOG_LINK_URL);
  expect(row.content).toContain("<ul>");

  const imageNode = findImageNode(row.content_json);
  expect(imageNode).not.toBeNull();
  const imageUrl = contentImageSource(row.content);
  expect(imageNode?.attrs).toMatchObject({
    alt: BLOG_IMAGE_ALT,
    altReviewed: true,
    src: imageUrl,
  });
  if (expectedImageUrl) expect(imageUrl).toBe(expectedImageUrl);
  return imageUrl;
}

async function expectRestoredWysiwygBlog(
  page: Page,
  expectedImageUrl: string,
): Promise<void> {
  await page.goto(`${ADMIN_URL}/blog/${BLOG_SLUG}`);
  const editor = page.getByRole("textbox", {
    name: "본문 WYSIWYG 편집기",
  });
  await expect(editor).toBeEditable({ timeout: 20_000 });
  await expect(editor.locator("h2")).toHaveText(BLOG_HEADING);
  await expect(editor.locator("strong")).toHaveText(BLOG_BOLD_TEXT);
  await expect(
    editor.getByRole("link", { name: BLOG_LINK_TEXT }),
  ).toHaveAttribute("href", BLOG_LINK_URL);
  await expect(editor.locator("ul li")).toHaveText([
    BLOG_LIST_ITEM_ONE,
    BLOG_LIST_ITEM_TWO,
  ]);
  const image = editor.getByRole("img", { name: BLOG_IMAGE_ALT });
  await expect(image).toHaveAttribute("alt", BLOG_IMAGE_ALT);
  await expect(image).toHaveAttribute("src", expectedImageUrl);
}

async function attachedFrame(frameLocator: Locator): Promise<Frame> {
  const handle = await frameLocator.elementHandle();
  const frame = await handle?.contentFrame();
  if (!frame) throw new Error("The raw HTML iframe did not attach.");
  return frame;
}

async function expectPortfolioAbsent(
  page: Page,
  request: APIRequestContext,
): Promise<void> {
  const detail = await responseText(request, `/portfolio/${PORTFOLIO_SLUG}`);
  expect(detail.status).toBe(404);

  for (const path of ["/portfolio", "/", "/service/mvp"] as const) {
    await gotoFresh(page, path);
    await expect(publicLink(page, `/portfolio/${PORTFOLIO_SLUG}`)).toHaveCount(
      0,
    );
  }

  expect(await sitemapText(request)).not.toContain(
    `/portfolio/${PORTFOLIO_SLUG}`,
  );
}

async function expectBlogAbsent(
  page: Page,
  request: APIRequestContext,
  checkRelated: boolean,
): Promise<void> {
  const detail = await responseText(request, `/blog/${BLOG_SLUG}`);
  expect(detail.status).toBe(404);

  for (const path of ["/blog", "/"] as const) {
    await gotoFresh(page, path);
    await expect(publicLink(page, `/blog/${BLOG_SLUG}`)).toHaveCount(0);
  }

  if (checkRelated) {
    await gotoFresh(page, `/blog/${BLOG_SUPPORT_ROWS.at(-1)?.slug}`);
    await expect(publicLink(page, `/blog/${BLOG_SLUG}`)).toHaveCount(0);
  }

  expect(await sitemapText(request)).not.toContain(`/blog/${BLOG_SLUG}`);
}

async function switchPortfolioToRawHtml(page: Page): Promise<void> {
  const rawMode = page.getByRole("radio", { name: /HTML 원문/u });
  await expect(rawMode).toBeEnabled();
  await rawMode.click();
  await expect(page.locator('textarea[aria-label="HTML 원문"]')).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function createRawPortfolioDraft(page: Page): Promise<void> {
  await page.goto(`${ADMIN_URL}/portfolio/new`);
  await expect(
    page.getByRole("heading", { name: "신규 포트폴리오 등록" }),
  ).toBeVisible();

  await page.locator("#portfolio-type").selectOption("mvp");
  await page.locator("#portfolio-slug").fill(PORTFOLIO_SLUG);
  await page.locator("#portfolio-company-name").fill(PORTFOLIO_TITLE);
  await page
    .locator("#portfolio-product-description")
    .fill("실제 Admin 원문 렌더러 검증 프로젝트");
  await page.locator("#portfolio-estimate-label").fill("1,200만원");
  await page.locator("#portfolio-development-period").fill("4주");
  await page.locator("#portfolio-core-feature-0").fill("원문 iframe 격리");
  await page.locator("#portfolio-work-scope-0").fill("디자인 QA");
  await page.locator("#portfolio-thumbnail-alt").fill("E2E 포트폴리오");
  await page
    .locator("#portfolio-seo-description")
    .fill(PORTFOLIO_SEO_DESCRIPTION);

  await switchPortfolioToRawHtml(page);
  await page
    .locator('textarea[aria-label="HTML 원문"]')
    .fill(RAW_PORTFOLIO_HTML);

  const saveDraft = page.getByRole("button", {
    name: "임시저장",
    exact: true,
  });
  await expect(saveDraft).toBeEnabled();
  await saveDraft.click();
  await expect(page).toHaveURL(`${ADMIN_URL}/portfolio/${PORTFOLIO_SLUG}`);
}

async function publishRawPortfolio(page: Page): Promise<void> {
  await page
    .getByRole("checkbox", { name: "랜딩 설정 노출", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "서비스 섹션 설정 노출", exact: true })
    .check();
  const publish = page.getByRole("button", { name: "수정하기", exact: true });
  await expect(publish).toBeEnabled();
  await publish.click();
  await expect(page.getByText("Portfolio를 저장했습니다.")).toBeVisible();
}

async function placeCaretInParagraphWhitespace(
  page: Page,
  paragraph: Locator,
): Promise<void> {
  const box = await paragraph.boundingBox();
  if (!box) throw new Error("The editor paragraph has no visible bounds.");

  await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);
  await expect
    .poll(() =>
      paragraph.evaluate((element) => {
        const selection = element.ownerDocument.getSelection();
        return Boolean(
          selection?.isCollapsed &&
          selection.anchorNode &&
          element.contains(selection.anchorNode),
        );
      }),
    )
    .toBe(true);
}

async function populateWysiwygEditor(page: Page): Promise<void> {
  const editor = page.getByRole("textbox", {
    name: "본문 WYSIWYG 편집기",
  });
  await expect(editor).toBeEditable();
  await editor.click();

  await page.getByRole("button", { name: "제목 서식", exact: true }).click();
  await page.getByRole("button", { name: "제목 2", exact: true }).click();
  await editor.pressSequentially(BLOG_HEADING);
  await editor.press("Enter");

  const bold = page.getByRole("button", { name: "굵게", exact: true });
  await bold.click();
  await editor.pressSequentially(BLOG_BOLD_TEXT);
  await bold.click();
  await editor.press("Enter");

  await editor.pressSequentially(BLOG_LINK_TEXT);
  for (let index = 0; index < BLOG_LINK_TEXT.length; index += 1) {
    await page.keyboard.press("Shift+ArrowLeft");
  }
  await expect
    .poll(() =>
      editor.evaluate(
        (element) => element.ownerDocument.getSelection()?.toString() ?? "",
      ),
    )
    .toBe(BLOG_LINK_TEXT);
  await page.getByRole("button", { name: "링크 설정", exact: true }).click();
  await page.getByRole("textbox", { name: "링크 URL", exact: true }).fill(BLOG_LINK_URL);
  await page.getByRole("button", { name: "링크 적용", exact: true }).click();
  const editorLink = editor.getByRole("link", { name: BLOG_LINK_TEXT });
  await expect(editorLink).toHaveAttribute("href", BLOG_LINK_URL);
  const linkParagraph = editorLink.locator("xpath=parent::p");
  await placeCaretInParagraphWhitespace(page, linkParagraph);
  await expect(editor).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "링크 설정", exact: true }),
  ).toBeVisible();
  await expect(editorLink).toHaveAttribute("href", BLOG_LINK_URL);
  await page.keyboard.press("Enter");
  await expect(editorLink).toHaveAttribute("href", BLOG_LINK_URL);

  await page.getByRole("button", { name: "목록 서식", exact: true }).click();
  await page
    .getByRole("button", { name: "글머리 기호 목록", exact: true })
    .click();
  await editor.pressSequentially(BLOG_LIST_ITEM_ONE);
  await editor.press("Enter");
  await editor.pressSequentially(BLOG_LIST_ITEM_TWO);
  await editor.press("Enter");
  await editor.press("Enter");

  await page
    .getByLabel("본문 이미지 파일 선택", { exact: true })
    .setInputFiles(WEBP_UPLOAD);
  const alt = page.getByLabel("대체 텍스트", { exact: true });
  await expect(alt).toBeEnabled({ timeout: 20_000 });
  await alt.fill(BLOG_IMAGE_ALT);
  await alt.press("Tab");
  await expect(page.getByText("대체 텍스트를 검토했습니다.")).toBeVisible();
}

async function createAndPublishWysiwygBlog(page: Page): Promise<void> {
  await page.goto(`${ADMIN_URL}/blog/new`);
  await expect(
    page.getByRole("heading", { name: "신규 블로그 등록" }),
  ).toBeVisible();
  await page.locator("#blog-type").selectOption("mvp");
  await page.locator("#blog-title").fill(BLOG_TITLE);
  await page.locator("#blog-slug").fill(BLOG_SLUG);
  await page.locator("#blog-published-date").fill("2026-07-15");
  await page.locator("#blog-thumbnail-alt").fill("E2E 블로그 썸네일");
  await page.locator("#blog-summary").fill(BLOG_SUMMARY);
  await page.locator("#blog-seo-description").fill(BLOG_SEO_DESCRIPTION);
  await page.getByRole("checkbox", { name: /랜딩 설정/u }).check();
  await page.getByRole("checkbox", { name: /배너 설정/u }).check();
  await populateWysiwygEditor(page);

  const publish = page.getByRole("button", { name: "등록하기", exact: true });
  await expect(publish).toBeEnabled({ timeout: 20_000 });
  await publish.click();
  await expect(page).toHaveURL(`${ADMIN_URL}/blog/${BLOG_SLUG}`);
}

async function expectRawPortfolioPublished(
  page: Page,
  request: APIRequestContext,
  adminPreviewSource: string,
): Promise<void> {
  await gotoFresh(page, "/portfolio");
  await expect(publicLink(page, `/portfolio/${PORTFOLIO_SLUG}`)).toBeVisible();
  await expect(
    publicLink(page, `/portfolio/${PORTFOLIO_SUPPORT_SLUG}`),
  ).toBeVisible();
  await expect(
    publicLink(page, `/portfolio/${PORTFOLIO_SUPPORT_SLUG}`).locator("img"),
  ).toHaveCount(0);

  await page
    .getByRole("button", { name: "기업 홈페이지", exact: true })
    .click();
  await expect(
    publicLink(page, `/portfolio/${PORTFOLIO_SUPPORT_SLUG}`),
  ).toBeVisible();
  await page.getByRole("button", { name: "MVP", exact: true }).click();
  await expect(
    publicLink(page, `/portfolio/${PORTFOLIO_SUPPORT_SLUG}`),
  ).toHaveCount(0);

  await gotoFresh(page, "/");
  await expect(publicLink(page, `/portfolio/${PORTFOLIO_SLUG}`)).toBeVisible();
  await gotoFresh(page, "/service/mvp");
  await expect(publicLink(page, `/portfolio/${PORTFOLIO_SLUG}`)).toBeVisible();

  await gotoFresh(page, `/portfolio/${PORTFOLIO_SLUG}`);
  await expect(page).toHaveTitle(`제로소싱 | ${PORTFOLIO_TITLE}`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    PORTFOLIO_SEO_DESCRIPTION,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://zerosourcing.kr/portfolio/${PORTFOLIO_SLUG}`,
  );

  const frameElement = page.locator(`iframe[title="${PORTFOLIO_TITLE}"]`);
  await expect(frameElement).toHaveAttribute("sandbox", "allow-scripts");
  await expect(frameElement).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(frameElement).toHaveAttribute("scrolling", "no");
  await expect(frameElement).toHaveAttribute("srcdoc", adminPreviewSource);
  const frame = page.frameLocator(`iframe[title="${PORTFOLIO_TITLE}"]`);
  await expect(frame.locator("html")).toHaveAttribute("data-e2e-script", "ran");
  await expect(frame.locator("html")).toHaveAttribute(
    "data-parent-read",
    "blocked",
  );
  await expect(frame.locator("html")).toHaveAttribute(
    "data-top-navigation",
    "blocked",
  );
  await expect(frame.locator("html")).toHaveAttribute(
    "data-fonts-ready",
    "resolved",
  );
  await expect(page.locator("body")).not.toHaveAttribute(
    "data-raw-frame-escaped",
    "true",
  );

  await expect
    .poll(async () =>
      frame.locator("html").evaluate(() => {
        const scrollingElement = document.scrollingElement;
        if (!scrollingElement) return false;
        return (
          scrollingElement.scrollHeight <= scrollingElement.clientHeight &&
          getComputedStyle(document.documentElement).overflowY !== "scroll" &&
          getComputedStyle(document.body).overflowY !== "scroll"
        );
      }),
    )
    .toBe(true);

  const initialHeight = (await frameElement.boundingBox())?.height ?? 0;
  const attached = await attachedFrame(frameElement);
  await attached.evaluate((source) => {
    const image = document.querySelector<HTMLImageElement>("#e2e-late-image");
    if (!image) throw new Error("The late raw image is missing.");
    image.style.height = "640px";
    image.src = source;
  }, LATE_IMAGE_DATA_URL);
  await expect
    .poll(async () => (await frameElement.boundingBox())?.height ?? 0)
    .toBeGreaterThan(initialHeight + 400);
  await expect(page).toHaveURL(
    new RegExp(`/portfolio/${PORTFOLIO_SLUG}(?:\\?|$)`, "u"),
  );

  const sitemap = await sitemapText(request);
  expect(sitemap).toContain(
    `https://zerosourcing.kr/portfolio/${PORTFOLIO_SLUG}`,
  );
}

async function expectWysiwygBlogPublished(
  page: Page,
  request: APIRequestContext,
  expectedImageUrl: string,
): Promise<void> {
  await gotoFresh(page, `/blog/${BLOG_SLUG}`);
  await expect(page).toHaveTitle(`제로소싱 | ${BLOG_TITLE}`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    BLOG_SEO_DESCRIPTION,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://zerosourcing.kr/blog/${BLOG_SLUG}`,
  );

  const content = page.locator(".rich-content");
  await expect(content.locator("h2")).toContainText(BLOG_HEADING);
  await expect(content.locator("strong")).toContainText(BLOG_BOLD_TEXT);
  const link = content.getByRole("link", { name: BLOG_LINK_TEXT });
  await expect(link).toHaveAttribute("href", BLOG_LINK_URL);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(content.locator("ul li")).toHaveText([
    BLOG_LIST_ITEM_ONE,
    BLOG_LIST_ITEM_TWO,
  ]);
  const image = content.getByRole("img", { name: BLOG_IMAGE_ALT });
  await expect(image).toHaveAttribute("src", expectedImageUrl);
  await expect(image).toHaveAttribute("loading", "lazy");
  await expectLoadedImageDimensions(image, 640, 360);
  await expect(
    publicLink(page, `/blog/${BLOG_SUPPORT_ROWS[0].slug}`),
  ).toBeVisible();

  await gotoFresh(page, "/blog");
  await expect(publicLink(page, `/blog/${BLOG_SLUG}`)).toBeVisible();
  await expect(page.getByText("NEW", { exact: true })).toHaveCount(3);
  await expect(
    publicLink(page, `/blog/${BLOG_SUPPORT_ROWS[0].slug}`).locator(
      'img:not([src="/brand/zerofee-blog-mark.svg"])',
    ),
  ).toHaveCount(0);
  const search = page.getByRole("searchbox", { name: "블로그 검색" });
  await search.fill(BLOG_SUPPORT_ROWS[0].title);
  const blogList = page.getByRole("region", { name: "블로그 글 목록" });
  await expectVisibleMatches(
    publicLink(blogList, `/blog/${BLOG_SUPPORT_ROWS[0].slug}`),
    1,
  );
  await search.fill("e2e-no-result-keyword");
  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();

  await gotoFresh(page, "/");
  await expect(publicLink(page, `/blog/${BLOG_SLUG}`)).toBeVisible();
  expect(await sitemapText(request)).toContain(
    `https://zerosourcing.kr/blog/${BLOG_SLUG}`,
  );
}

const PUBLIC_QA_VIEWPORTS = [
  { height: 1_080, name: "1920", width: 1_920 },
  { height: 900, name: "1080", width: 1_080 },
  { height: 900, name: "640", width: 640 },
  { height: 844, name: "390", width: 390 },
] as const;

async function capturePublicQABreakpoints(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  const surfaces = [
    {
      assertReady: async () => {
        await expect(
          publicLink(page, `/portfolio/${PORTFOLIO_SLUG}`),
        ).toBeVisible();
        await expect(publicLink(page, `/blog/${BLOG_SLUG}`)).toBeVisible();
      },
      name: "home",
      path: "/",
    },
    {
      assertReady: async () => {
        await expect(
          publicLink(page, `/portfolio/${PORTFOLIO_SLUG}`),
        ).toBeVisible();
      },
      name: "service-mvp",
      path: "/service/mvp",
    },
    {
      assertReady: async () => {
        await expect(
          publicLink(page, `/portfolio/${PORTFOLIO_SLUG}`),
        ).toBeVisible();
      },
      name: "portfolio-list",
      path: "/portfolio",
    },
    {
      assertReady: async () => {
        const frameElement = page.locator(`iframe[title="${PORTFOLIO_TITLE}"]`);
        await expect(frameElement).toBeVisible();
        const frame = page.frameLocator(`iframe[title="${PORTFOLIO_TITLE}"]`);
        await expect(frame.locator("html")).toHaveAttribute(
          "data-e2e-script",
          "ran",
        );
        await expect(frame.locator("html")).toHaveAttribute(
          "data-fonts-ready",
          "resolved",
        );
        await expect(frame.locator("#e2e-raw-marker")).toBeVisible();
      },
      name: "portfolio-detail",
      path: `/portfolio/${PORTFOLIO_SLUG}`,
    },
    {
      assertReady: async () => {
        await expect(publicLink(page, `/blog/${BLOG_SLUG}`)).toBeVisible();
      },
      name: "blog-list",
      path: "/blog",
    },
    {
      assertReady: async () => {
        await expect(page.locator(".rich-content h2")).toHaveText(BLOG_HEADING);
        const image = page
          .locator(".rich-content")
          .getByRole("img", { name: BLOG_IMAGE_ALT });
        await expect(image).toHaveAttribute("src", /\.webp$/u);
        await expectLoadedImageDimensions(image, 640, 360);
      },
      name: "blog-detail",
      path: `/blog/${BLOG_SLUG}`,
    },
  ] as const;

  for (const viewport of PUBLIC_QA_VIEWPORTS) {
    await page.setViewportSize({
      height: viewport.height,
      width: viewport.width,
    });

    for (const surface of surfaces) {
      await gotoFresh(page, surface.path);
      await surface.assertReady();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      });
      const horizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(
        horizontalOverflow,
        `${surface.name} must not overflow horizontally at ${viewport.width}px.`,
      ).toBeLessThanOrEqual(1);
      await page.screenshot({
        animations: "disabled",
        fullPage: true,
        path: testInfo.outputPath(
          "public-qa",
          `${surface.name}-${viewport.name}.png`,
        ),
      });
    }
  }
}

async function saveDraftThroughAdmin(
  page: Page,
  entity: "blog" | "portfolio",
): Promise<void> {
  const draft = page.getByRole("button", { name: "임시저장", exact: true });
  await expect(draft).toBeEnabled({ timeout: 20_000 });
  await draft.click();
  await expect(
    page.getByText(
      entity === "blog"
        ? "Blog 글을 저장했습니다."
        : "Portfolio를 저장했습니다.",
    ),
  ).toBeVisible();
}

async function unpublishThroughAdmin(
  page: Page,
  entity: "blog" | "portfolio",
  slug: string,
): Promise<void> {
  await page.goto(`${ADMIN_URL}/${entity}/${slug}`);
  await saveDraftThroughAdmin(page, entity);
}

async function deleteThroughAdmin(
  page: Page,
  entity: "blog" | "portfolio",
  slug: string,
): Promise<void> {
  await page.goto(`${ADMIN_URL}/${entity}/${slug}`);
  const remove = page.getByRole("button", { name: "삭제", exact: true });
  await expect(remove).toBeEnabled({ timeout: 20_000 });
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    await dialog.accept();
  });
  await remove.click();
  await expect(page).toHaveURL(`${ADMIN_URL}/${entity}`);
}

test.describe("Admin-managed public content", () => {
  test.describe.configure({ mode: "serial" });

  let serviceClient: SupabaseClient | undefined;

  test.beforeAll(async () => {
    serviceClient = createLocalServiceClient();
    await cleanupE2EContent(serviceClient);
  });

  test.afterAll(async () => {
    if (serviceClient) await cleanupE2EContent(serviceClient);
  });

  test("cleanup guard rejects noncanonical thumbnail aliases", () => {
    const slug = PORTFOLIO_SLUG;
    const valid = `${slug}/01234567-89ab-4cde-8f01-23456789abcd.webp`;
    expect(isCanonicalE2EThumbnailPath(slug, valid)).toBe(true);

    for (const candidate of [
      `${slug}/../foreign.webp`,
      `${slug}/nested/01234567-89ab-4cde-8f01-23456789abcd.webp`,
      `${slug}/%2e%2e%2fforeign.webp`,
      `${slug}\\01234567-89ab-4cde-8f01-23456789abcd.webp`,
      `${slug}/01234567-89ab-4cde-8f01-23456789abcd.webp%00`,
      `${slug}/01234567-89ab-1cde-8f01-23456789abcd.webp`,
      `${slug}/01234567-89ab-4cde-7f01-23456789abcd.webp`,
      `other/01234567-89ab-4cde-8f01-23456789abcd.webp`,
    ]) {
      expect(isCanonicalE2EThumbnailPath(slug, candidate)).toBe(false);
    }
  });

  test("publishes and removes raw Portfolio and WYSIWYG Blog through the real Admin", async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(240_000);
    const client = serviceClient;
    if (!client) throw new Error("The local service client is missing.");

    await test.step("log in through the real Admin form", async () => {
      await loginThroughAdmin(page);
    });

    const publicRawFrameSource = buildRawHtmlSource(RAW_PORTFOLIO_HTML);
    await test.step("create an exact raw HTML Portfolio draft", async () => {
      await createRawPortfolioDraft(page);
      const row = await portfolioRow(client);
      expect(row.status).toBe("draft");
      expect(row.content_authoring_mode).toBe("raw_html");
      expect(row.content).toBe(RAW_PORTFOLIO_HTML);
      expect(row.thumbnail_public_url).toBeNull();
      await expectPortfolioAbsent(page, request);
    });

    await test.step("publish the raw Portfolio to every selected surface", async () => {
      await page.goto(`${ADMIN_URL}/portfolio/${PORTFOLIO_SLUG}`);
      await publishRawPortfolio(page);
      await expect
        .poll(async () => (await portfolioRow(client)).status)
        .toBe("published");
      const row = await portfolioRow(client);
      expect(row.landing_published).toBe(true);
      expect(row.service_published).toBe(true);
      await updatePortfolioOrderingAndSeedSupport(client);
      await expectRawPortfolioPublished(page, request, publicRawFrameSource);
    });

    let blogImageUrl = "";
    let publishedBlogAssetScope = "";
    let publishedBlogDocument: unknown;
    await test.step("publish structured WYSIWYG Blog content with a WEBP", async () => {
      await createAndPublishWysiwygBlog(page);
      await expect
        .poll(async () => (await blogRow(client)).status)
        .toBe("published");
      const row = await blogRow(client);
      expect(row.landing_published).toBe(true);
      expect(row.banner_published).toBe(true);
      expect(row.thumbnail_public_url).toBeNull();
      blogImageUrl = expectStoredWysiwygBlog(row);
      expect(blogImageUrl).toMatch(
        new RegExp(
          `^${localStoragePublicBase}/content/blog/${row.content_asset_scope}/images/[0-9a-f-]+\\.webp$`,
          "u",
        ),
      );
      publishedBlogAssetScope = row.content_asset_scope;
      publishedBlogDocument = structuredClone(row.content_json);
      await updateBlogOrderingAndSeedSupport(client);
      await expectWysiwygBlogPublished(page, request, blogImageUrl);
    });

    await test.step("capture every public QA surface at four breakpoints", async () => {
      await capturePublicQABreakpoints(page, testInfo);
    });

    await test.step("sanitize hostile stored WYSIWYG HTML publicly", async () => {
      const row = await blogRow(client);
      const hostileImage = row.content.replace(
        "<img ",
        "<img onerror=\"document.body.dataset.e2eImageHandler='true'\" ",
      );
      if (hostileImage === row.content) {
        throw new Error("The generated image could not be instrumented.");
      }
      const hostileContent = `${hostileImage}<script>document.body.dataset.e2eScriptExecuted="true"</script><p onclick="document.body.dataset.e2eClickHandler='true'">${SANITIZED_MARKER}</p>`;
      await setBlogContent(client, hostileContent);

      await gotoFresh(page, `/blog/${BLOG_SLUG}`);
      const content = page.locator(".rich-content");
      await expect(content.locator("script")).toHaveCount(0);
      const marker = content.getByText(SANITIZED_MARKER, { exact: true });
      await expect(marker).toBeVisible();
      await expect(marker).not.toHaveAttribute("onclick");
      const image = content.getByRole("img", { name: BLOG_IMAGE_ALT });
      await expect(image).toHaveAttribute("src", blogImageUrl);
      await expect(image).not.toHaveAttribute("onerror");
      await expect(page.locator("body")).not.toHaveAttribute(
        "data-e2e-script-executed",
        "true",
      );
      await expect(page.locator("body")).not.toHaveAttribute(
        "data-e2e-image-handler",
        "true",
      );
    });

    await test.step("unpublish both records and remove them from every public surface", async () => {
      await unpublishThroughAdmin(page, "portfolio", PORTFOLIO_SLUG);
      await expect
        .poll(async () => (await portfolioRow(client)).status)
        .toBe("draft");
      await expectPortfolioAbsent(page, request);

      if (!publishedBlogAssetScope || !publishedBlogDocument) {
        throw new Error("The published Blog snapshot is missing.");
      }
      await expectRestoredWysiwygBlog(page, blogImageUrl);
      await saveDraftThroughAdmin(page, "blog");
      await expect
        .poll(async () => (await blogRow(client)).status)
        .toBe("draft");
      const draftBlog = await blogRow(client);
      expect(draftBlog.content_asset_scope).toBe(publishedBlogAssetScope);
      expect(draftBlog.content_json).toEqual(publishedBlogDocument);
      expectStoredWysiwygBlog(draftBlog, blogImageUrl);
      expect(draftBlog.content).not.toContain(SANITIZED_MARKER);
      expect(draftBlog.content).not.toContain("<script");
      expect(draftBlog.content).not.toContain("onerror=");
      await expectBlogAbsent(page, request, true);
    });

    await test.step("permanently delete the Portfolio and soft-delete the Blog", async () => {
      await deleteThroughAdmin(page, "portfolio", PORTFOLIO_SLUG);
      await expect.poll(async () => portfolioExists(client)).toBe(false);
      await expectPortfolioAbsent(page, request);

      await deleteThroughAdmin(page, "blog", BLOG_SLUG);
      await expect
        .poll(async () => (await blogRow(client)).deleted_at)
        .not.toBeNull();
      await expectBlogAbsent(page, request, true);
    });
  });
});
