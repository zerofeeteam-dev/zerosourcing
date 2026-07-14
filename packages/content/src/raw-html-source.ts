export const RAW_HTML_HEIGHT_MESSAGE_TYPE =
  "zerosourcing:raw-html-height" as const;

const bridge = `<script>
(() => {
  const send = () => {
    const root = document.documentElement;
    const body = document.body;
    const height = Math.max(
      root.scrollHeight,
      root.offsetHeight,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    );
    window.parent.postMessage({
      type: "${RAW_HTML_HEIGHT_MESSAGE_TYPE}",
      height
    }, "*");
  };
  const resizeObserver = new ResizeObserver(send);
  const mutationObserver = new MutationObserver(send);
  const start = () => {
    resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });
    send();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
  document.addEventListener("load", send, true);
  window.addEventListener("load", send);
  window.addEventListener("resize", send);
  if (document.fonts) document.fonts.ready.then(send);
})();
</script>`;

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildRawHtmlSource(
  html: string,
  assetBaseUrl?: string,
): string {
  const base = assetBaseUrl
    ? `<base href="${escapeAttribute(assetBaseUrl)}">`
    : "";
  const runtime = `${base}${bridge}`;
  // Only recognize a standards-mode prefix. Never search for head/base tags:
  // those strings may legally occur inside comments, scripts, or templates.
  const doctypePrefix = /^(\uFEFF?\s*<!doctype\s+html\s*>)/i.exec(html)?.[1];
  if (doctypePrefix) {
    return `${doctypePrefix}${runtime}${html.slice(doctypePrefix.length)}`;
  }
  return `${runtime}${html}`;
}
