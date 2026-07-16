import {
  SUPPORTED_CONTENT_SCHEMA_VERSION,
  type TiptapDocument,
} from "@repo/content/types";
import {
  useEffect,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { createRoot } from "react-dom/client";
import "@repo/content/rich-content.css";
import "../../../design-system.css";
import "./App.css";
import {
  AdminArrowRightIcon,
  AdminButton,
  AdminFormActions,
  AdminFormPage,
  AdminShell,
} from "./components/admin";
import { BlogFormFields } from "./pages/blog/BlogFormFields";
import type { BlogFormState } from "./pages/blog/blogTypes";
import { applyAdminPageTitle } from "./lib/pageTitle";
import styles from "./pages/BlogAdminPage.module.css";

type VisualTestVariant =
  | "content-editor-raw"
  | "content-editor-wysiwyg"
  | "default";

type VisualTestConfig = {
  readonly documentKey: string;
  readonly form: BlogFormState;
  readonly title: string;
};

type WriteProtectedVisualBoundaryProps = {
  readonly children: ReactNode;
};

function blockVisualTestInteraction(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Production editor controls stay visually exact, while every user-driven
 * mutation is stopped before an upload, removal, or form handler can run.
 */
function WriteProtectedVisualBoundary({
  children,
}: WriteProtectedVisualBoundaryProps) {
  return (
    <div
      data-visual-test-write-protected="true"
      onBeforeInputCapture={blockVisualTestInteraction}
      onChangeCapture={blockVisualTestInteraction}
      onClickCapture={blockVisualTestInteraction}
      onCutCapture={blockVisualTestInteraction}
      onDragOverCapture={blockVisualTestInteraction}
      onDropCapture={blockVisualTestInteraction}
      onInputCapture={blockVisualTestInteraction}
      onKeyDownCapture={blockVisualTestInteraction}
      onPasteCapture={blockVisualTestInteraction}
      onSubmitCapture={blockVisualTestInteraction}
    >
      {children}
    </div>
  );
}

const defaultAssetScope = "00000000-0000-4000-8000-000000000100";
const rawAssetScope = "00000000-0000-4000-8000-000000000101";
const wysiwygAssetScope = "00000000-0000-4000-8000-000000000102";

const defaultVisualForm: BlogFormState = {
  bannerAlt: "",
  bannerPublished: true,
  bannerSections: '[{"id":1},{"id":2}]',
  content: "",
  contentAssetBaseEnabled: false,
  contentAssetScope: defaultAssetScope,
  contentAuthoringMode: "wysiwyg",
  contentJson: {
    type: "doc",
    content: [{ type: "paragraph" }],
  },
  contentMode: "html",
  contentSchemaVersion: SUPPORTED_CONTENT_SCHEMA_VERSION,
  contentSourceBackup: null,
  landingPublished: true,
  landingSections: '[{"id":1},{"id":2},{"id":3}]',
  publishedDate: "",
  seoDescription: "",
  slug: "",
  status: "draft",
  summary: "",
  thumbnailAlt: "",
  title: "",
  type: "",
};

const rawHtml = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Meet It Plus 프로젝트 상세</title>
    <style>
      :root { color-scheme: light; font-family: Pretendard, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f5f7fb; color: #171a22; }
      main { display: grid; gap: 24px; padding: 40px; }
      header, section { border-radius: 20px; background: white; padding: 32px; }
      header { background: linear-gradient(135deg, #2859e8, #6f8cff); color: white; }
      h1, h2, p { margin: 0; }
      header p { margin-top: 12px; opacity: .86; }
      .visual { display: grid; place-items: center; min-height: 220px; border-radius: 16px;
        background: linear-gradient(135deg, #edf2ff, #d9e3ff); color: #2859e8; }
      .visual svg { width: min(360px, 82%); height: auto; }
      .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .fact { border-radius: 12px; background: #f5f7fb; padding: 16px; }
      .asset-resolution { display: grid; gap: 14px; }
      .resolved-list { display: grid; gap: 10px; margin: 0; }
      .resolved-row { display: grid; gap: 4px; border-radius: 12px;
        background: #f5f7fb; padding: 14px; }
      .resolved-row dt { font-weight: 700; }
      .resolved-row dd { margin: 0; color: #5a6376; font-family: ui-monospace, monospace;
        font-size: 13px; overflow-wrap: anywhere; }
      .relative-link { color: #2859e8; pointer-events: none; width: fit-content; }
      @media (max-width: 640px) {
        main { gap: 16px; padding: 20px; }
        header, section { border-radius: 14px; padding: 22px; }
        .facts { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Meet It Plus</h1>
        <p>모임 탐색부터 참여까지 이어지는 커뮤니티 서비스 구축 사례</p>
      </header>
      <section class="visual" aria-label="프로젝트 대표 화면 예시">
        <svg viewBox="0 0 480 220" role="img" aria-label="Meet It Plus 화면 구성도">
          <rect x="18" y="18" width="444" height="184" rx="18" fill="#fff" />
          <rect x="42" y="42" width="110" height="136" rx="12" fill="#2859e8" />
          <rect x="176" y="42" width="260" height="24" rx="8" fill="#b9c9f7" />
          <rect x="176" y="82" width="122" height="96" rx="12" fill="#e6ecff" />
          <rect x="314" y="82" width="122" height="96" rx="12" fill="#d8e3ff" />
        </svg>
      </section>
      <section class="facts">
        <div class="fact"><strong>역할</strong><p>기획 · 디자인 · 개발</p></div>
        <div class="fact"><strong>기간</strong><p>12주</p></div>
        <div class="fact"><strong>플랫폼</strong><p>반응형 웹</p></div>
      </section>
      <section class="asset-resolution" aria-labelledby="asset-resolution-title">
        <h2 id="asset-resolution-title">Storage 상대경로 해석</h2>
        <dl class="resolved-list">
          <div class="resolved-row">
            <dt>baseURI</dt>
            <dd id="resolved-base-uri">확인 중</dd>
          </div>
          <div class="resolved-row">
            <dt>relative href</dt>
            <dd id="resolved-relative-href">확인 중</dd>
          </div>
          <div class="resolved-row">
            <dt>relative src</dt>
            <dd id="resolved-relative-src">확인 중</dd>
          </div>
        </dl>
        <a
          aria-disabled="true"
          class="relative-link"
          data-relative-href
          href="./case-study/"
          tabindex="-1"
        >상대경로 링크 표식</a>
        <source
          data-relative-src
          id="relative-asset-fixture"
          src="./feature-images/meetitplus-dashboard.webp"
          type="image/webp"
        >
      </section>
    </main>
    <script>
      (() => {
        const link = document.querySelector("[data-relative-href]");
        const asset = document.querySelector("[data-relative-src]");
        document.getElementById("resolved-base-uri").textContent = document.baseURI;
        document.getElementById("resolved-relative-href").textContent = link.href;
        document.getElementById("resolved-relative-src").textContent = asset.src;
        link.addEventListener("click", (event) => event.preventDefault());
      })();
    </script>
  </body>
</html>`;

const rawVisualForm: BlogFormState = {
  ...defaultVisualForm,
  content: rawHtml,
  contentAssetBaseEnabled: true,
  contentAssetScope: rawAssetScope,
  contentAuthoringMode: "raw_html",
  contentMode: "html",
  contentSourceBackup: rawHtml,
  publishedDate: "2026-07-15",
  seoDescription:
    "Meet It Plus 커뮤니티 서비스의 기획, 디자인, 개발 과정을 소개합니다.",
  slug: "meet-it-plus-raw-html",
  status: "published",
  summary: "완성 HTML 원문과 상대경로 asset을 함께 관리하는 사례입니다.",
  thumbnailAlt: "Meet It Plus 프로젝트 화면",
  title: "Meet It Plus 프로젝트 상세",
  type: "application",
};

const wysiwygDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "프로젝트를 시작한 이유" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "아이디어를 빠르게 검증하면서도",
        },
        { type: "text", text: " 운영팀이 직접 콘텐츠를 관리할 수 있도록 " },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: { href: "https://zerosourcing.co.kr/portfolio" },
            },
          ],
          text: "관리 경험",
        },
        { type: "text", text: "을 함께 설계했습니다." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "핵심 구현 범위" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "관리자 콘텐츠 작성과 미리보기" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "반응형 목록 및 상세 화면" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "게시 전 이미지 대체 텍스트 검수" },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "작성 화면에서 확인한 구조가 공개 화면에도 그대로 이어집니다.",
            },
          ],
        },
      ],
    },
  ],
} as const satisfies TiptapDocument;

const wysiwygVisualForm: BlogFormState = {
  ...defaultVisualForm,
  content:
    '<h2>프로젝트를 시작한 이유</h2><p><strong>아이디어를 빠르게 검증하면서도</strong> 운영팀이 직접 콘텐츠를 관리할 수 있도록 <a target="_blank" rel="noopener noreferrer nofollow" href="https://zerosourcing.co.kr/portfolio">관리 경험</a>을 함께 설계했습니다.</p><h3>핵심 구현 범위</h3><ul><li><p>관리자 콘텐츠 작성과 미리보기</p></li><li><p>반응형 목록 및 상세 화면</p></li><li><p>게시 전 이미지 대체 텍스트 검수</p></li></ul><blockquote><p>작성 화면에서 확인한 구조가 공개 화면에도 그대로 이어집니다.</p></blockquote>',
  contentAssetBaseEnabled: false,
  contentAssetScope: wysiwygAssetScope,
  contentAuthoringMode: "wysiwyg",
  contentJson: wysiwygDocument,
  contentMode: "html",
  contentSourceBackup: null,
  publishedDate: "2026-07-15",
  seoDescription:
    "WYSIWYG 에디터로 작성한 프로젝트 기획과 핵심 구현 범위를 소개합니다.",
  slug: "managed-content-wysiwyg",
  status: "published",
  summary: "제목, 링크, 목록을 조합한 WYSIWYG 콘텐츠 예시입니다.",
  thumbnailAlt: "관리형 콘텐츠 편집 화면",
  title: "관리자가 직접 완성하는 콘텐츠",
  type: "insight",
};

const visualTestConfigs = {
  "content-editor-raw": {
    documentKey: "blog:visual:content-editor-raw:v1",
    form: rawVisualForm,
    title: "HTML 원문 블로그 등록",
  },
  "content-editor-wysiwyg": {
    documentKey: "blog:visual:content-editor-wysiwyg:v1",
    form: wysiwygVisualForm,
    title: "WYSIWYG 블로그 등록",
  },
  default: {
    documentKey: "blog:new:visual-test",
    form: defaultVisualForm,
    title: "신규 블로그 등록",
  },
} as const satisfies Record<VisualTestVariant, VisualTestConfig>;

const requestedVariant = new URLSearchParams(window.location.search).get(
  "visualTest",
);
const visualTestVariant: VisualTestVariant =
  requestedVariant === "content-editor-raw" ||
  requestedVariant === "content-editor-wysiwyg"
    ? requestedVariant
    : "default";
const visualTestConfig = visualTestConfigs[visualTestVariant];

function VisualTest() {
  const [form, setForm] = useState<BlogFormState>(visualTestConfig.form);

  useEffect(() => {
    applyAdminPageTitle();
  }, []);

  return (
    <AdminShell activeItem="blog">
      <AdminFormPage
        actions={
          <AdminFormActions
            leading={
              <AdminButton
                className={styles.formActionButton}
                size="figma"
                variant="secondary"
              >
                목록으로
              </AdminButton>
            }
            trailing={
              <>
                <AdminButton
                  className={styles.formActionButton}
                  size="figma"
                  variant="secondary"
                >
                  임시저장
                </AdminButton>
                <AdminButton
                  className={`${styles.formActionButton} ${styles.submitActionButton}`}
                  icon={<AdminArrowRightIcon size={16} />}
                  iconPosition="right"
                  size="figma"
                >
                  등록하기
                </AdminButton>
              </>
            }
          />
        }
        title={visualTestConfig.title}
      >
        <WriteProtectedVisualBoundary>
          <BlogFormFields
            banner={{ removed: false }}
            documentKey={visualTestConfig.documentKey}
            fieldErrors={{}}
            form={form}
            isDisabled={false}
            onBannerChange={() => undefined}
            onBannerRemove={() => undefined}
            onContentBusyChange={() => undefined}
            onContentChange={(value) =>
              setForm((current) => ({ ...current, ...value }))
            }
            onFieldChange={(key, value) =>
              setForm((current) => ({ ...current, [key]: value }))
            }
            onPendingAssetCountChange={() => undefined}
            onThumbnailChange={() => undefined}
            onThumbnailRemove={() => undefined}
            thumbnail={{ removed: false }}
          />
        </WriteProtectedVisualBoundary>
      </AdminFormPage>
    </AdminShell>
  );
}

createRoot(document.getElementById("root")!).render(<VisualTest />);
