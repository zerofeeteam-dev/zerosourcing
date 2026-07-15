import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { replaceImagesForPreview } from "./rawHtmlImageSlots";
import styles from "./AdminContentPreview.module.css";

type AdminContentPreviewProps = {
  readonly assetBaseUrl?: string;
  readonly disabled: boolean;
  readonly html: string;
  readonly interactiveImages: boolean;
  readonly onSelectImage: (slotIndex: number) => void;
  readonly uploadingSlot: number | null;
};

const ADMIN_PREVIEW_HEIGHT_MESSAGE_TYPE =
  "zerosourcing:admin-preview-height" as const;
const ADMIN_PREVIEW_IMAGE_SELECT_MESSAGE_TYPE =
  "zerosourcing:admin-preview-image-select" as const;
const ADMIN_PREVIEW_MEASURE_REQUEST_TYPE =
  "zerosourcing:admin-preview-measure" as const;

const previewStyle = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { background: #ffffff; color: #1f2937; font-family: Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; font-size: 14px; line-height: 1.5; margin: 0; }
  html { overflow-x: hidden !important; overflow-y: visible !important; }
  body { overflow: visible !important; padding: 16px; }
  img { height: auto; max-width: 100%; }
  button[data-admin-image-slot] { align-items: center !important; background: #f8fafc !important; border: 1px dashed #cbd5e1 !important; border-radius: 12px !important; color: #475569 !important; cursor: pointer !important; display: flex !important; font: inherit !important; height: 160px !important; justify-content: center !important; padding: 16px !important; width: 100% !important; }
  img[data-admin-image-slot] { cursor: pointer !important; }
  [data-admin-image-slot]:focus-visible { outline: 3px solid #dbeafe !important; outline-offset: 2px !important; }
  [data-admin-image-slot][aria-disabled="true"] { cursor: wait !important; opacity: 0.64 !important; }
`;

const previewBridge = `
(() => {
  const heightMessageType = "${ADMIN_PREVIEW_HEIGHT_MESSAGE_TYPE}";
  const selectMessageType = "${ADMIN_PREVIEW_IMAGE_SELECT_MESSAGE_TYPE}";
  const measureRequestType = "${ADMIN_PREVIEW_MEASURE_REQUEST_TYPE}";
  const viewportStyleId = "zerosourcing-admin-preview-viewport";

  const normalizeViewport = () => {
    if (document.getElementById(viewportStyleId)) return;
    const style = document.createElement("style");
    style.id = viewportStyleId;
    style.textContent = "html, body {\\n" +
      "  height: auto !important;\\n" +
      "  min-height: 0 !important;\\n" +
      "  max-height: none !important;\\n" +
      "  overflow-y: visible !important;\\n" +
      "}";
    (document.head || document.documentElement).append(style);
  };

  const sendHeight = () => {
    const root = document.documentElement;
    const body = document.body;
    const scrollingElement = document.scrollingElement;
    const height = Math.max(
      root.scrollHeight,
      root.offsetHeight,
      root.clientHeight,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      body ? body.clientHeight : 0,
      scrollingElement ? scrollingElement.scrollHeight : 0
    );
    window.parent.postMessage({ type: heightMessageType, height }, "*");
  };

  const slotIndex = (value) => {
    if (!/^(?:0|[1-9][0-9]*)$/.test(value || "")) return null;
    const index = Number(value);
    return Number.isSafeInteger(index) ? index : null;
  };

  const selectImage = (event) => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const target = event.target.closest("[data-admin-image-slot]");
    if (!target || target.getAttribute("aria-disabled") === "true") return;
    const index = slotIndex(target.getAttribute("data-admin-image-slot"));
    if (index === null) return;
    event.preventDefault();
    event.stopPropagation();
    window.parent.postMessage({ type: selectMessageType, slotIndex: index }, "*");
  };

  const start = () => {
    normalizeViewport();
    document.addEventListener("click", selectImage, true);
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(sendHeight);
      resizeObserver.observe(document.documentElement);
      if (document.body) resizeObserver.observe(document.body);
    }
    const mutationObserver = new MutationObserver(sendHeight);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });
    sendHeight();
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    if (!event.data || typeof event.data !== "object") return;
    if (event.data.type === measureRequestType) sendHeight();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
  document.addEventListener("load", sendHeight, true);
  window.addEventListener("load", sendHeight);
  window.addEventListener("resize", sendHeight);
  if (document.fonts) document.fonts.ready.then(sendHeight);
})();
`;

const initialFrameHeight = 400;

function numericSlotIndex(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return null;
  return value >= 0 ? value : null;
}

function attributeSlotIndex(value: string | null): number | null {
  if (value === null || !/^(?:0|[1-9][0-9]*)$/u.test(value)) return null;
  return numericSlotIndex(Number(value));
}

function buildPreviewSource(input: {
  readonly assetBaseUrl?: string;
  readonly disabled: boolean;
  readonly html: string;
  readonly interactiveImages: boolean;
  readonly uploadingSlot: number | null;
}): string {
  const preparedHtml = input.interactiveImages
    ? replaceImagesForPreview(input.html)
    : input.html;
  const document = new DOMParser().parseFromString(
    preparedHtml.trim().length > 0
      ? preparedHtml
      : "<p>본문을 입력하면 미리보기가 여기에 표시됩니다.</p>",
    "text/html",
  );

  for (const imageTrigger of document.querySelectorAll<HTMLElement>(
    "[data-admin-image-slot]",
  )) {
    const slotIndex = attributeSlotIndex(
      imageTrigger.getAttribute("data-admin-image-slot"),
    );
    if (slotIndex === null) {
      imageTrigger.remove();
      continue;
    }
    if (input.disabled || input.uploadingSlot === slotIndex) {
      imageTrigger.setAttribute("aria-disabled", "true");
      if (imageTrigger instanceof HTMLButtonElement)
        imageTrigger.disabled = true;
    }
    if (
      input.uploadingSlot === slotIndex &&
      imageTrigger instanceof HTMLButtonElement
    ) {
      imageTrigger.textContent = "이미지를 업로드하는 중입니다.";
    }
  }

  if (input.assetBaseUrl) {
    document.querySelectorAll("base").forEach((base) => base.remove());
    const base = document.createElement("base");
    base.href = input.assetBaseUrl;
    document.head.prepend(base);
  }
  const bridge = document.createElement("script");
  bridge.textContent = previewBridge;
  document.head.prepend(bridge);
  const style = document.createElement("style");
  style.textContent = previewStyle;
  document.head.append(style);

  return `<!doctype html>${document.documentElement.outerHTML}`;
}

export function AdminContentPreview({
  assetBaseUrl,
  disabled,
  html,
  interactiveImages,
  onSelectImage,
  uploadingSlot,
}: AdminContentPreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const onSelectImageRef = useRef(onSelectImage);
  onSelectImageRef.current = onSelectImage;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const interactiveImagesRef = useRef(interactiveImages);
  interactiveImagesRef.current = interactiveImages;
  const [frameHeight, setFrameHeight] = useState(initialFrameHeight);

  const source = useMemo(
    () =>
      buildPreviewSource({
        assetBaseUrl,
        disabled,
        html,
        interactiveImages,
        uploadingSlot,
      }),
    [assetBaseUrl, disabled, html, interactiveImages, uploadingSlot],
  );

  const requestFrameHeight = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: ADMIN_PREVIEW_MEASURE_REQUEST_TYPE },
      "*",
    );
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;
      const data = event.data as {
        readonly height?: unknown;
        readonly slotIndex?: unknown;
        readonly type?: unknown;
      };
      if (data.type === ADMIN_PREVIEW_HEIGHT_MESSAGE_TYPE) {
        const reportedHeight = data.height;
        if (typeof reportedHeight !== "number") return;
        if (!Number.isFinite(reportedHeight) || reportedHeight <= 0) return;
        setFrameHeight((current) => {
          const height = Math.max(
            initialFrameHeight,
            Math.ceil(reportedHeight),
          );
          return current === height ? current : height;
        });
        return;
      }
      if (
        data.type !== ADMIN_PREVIEW_IMAGE_SELECT_MESSAGE_TYPE ||
        disabledRef.current ||
        !interactiveImagesRef.current
      ) {
        return;
      }
      const slotIndex = numericSlotIndex(data.slotIndex);
      if (slotIndex !== null) onSelectImageRef.current(slotIndex);
    };

    window.addEventListener("message", onMessage);
    requestFrameHeight();
    return () => window.removeEventListener("message", onMessage);
  }, [requestFrameHeight]);

  return (
    <section className={styles.root} aria-label="본문 미리보기">
      <h3 className={styles.title}>미리보기</h3>
      <div className={styles.frameViewport}>
        <iframe
          className={styles.frame}
          onLoad={requestFrameHeight}
          ref={frameRef}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts"
          scrolling="no"
          srcDoc={source}
          style={{ height: `${frameHeight}px` }}
          title="본문 미리보기"
        />
      </div>
      {interactiveImages ? (
        <p className={styles.description}>
          이미지를 선택하면 새 파일로 교체할 수 있습니다.
        </p>
      ) : null}
    </section>
  );
}

export {
  ADMIN_PREVIEW_HEIGHT_MESSAGE_TYPE,
  ADMIN_PREVIEW_IMAGE_SELECT_MESSAGE_TYPE,
  buildPreviewSource,
};
