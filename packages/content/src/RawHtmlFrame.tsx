"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./RawHtmlFrame.module.css";
import {
  buildRawHtmlSource,
  RAW_HTML_HEIGHT_MESSAGE_TYPE,
} from "./raw-html-source";

export { buildRawHtmlSource } from "./raw-html-source";

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 200_000;

type RawHtmlFrameProps = {
  readonly assetBaseUrl?: string;
  readonly html: string;
  readonly title: string;
};

export function RawHtmlFrame({ assetBaseUrl, html, title }: RawHtmlFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const source = useMemo(
    () => buildRawHtmlSource(html, assetBaseUrl),
    [assetBaseUrl, html],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;
      const data = event.data as { height?: unknown; type?: unknown };
      if (
        data.type !== RAW_HTML_HEIGHT_MESSAGE_TYPE ||
        typeof data.height !== "number"
      ) {
        return;
      }
      if (!Number.isFinite(data.height) || data.height <= 0) return;
      setHeight(
        Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(data.height))),
      );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      className={styles.frame}
      ref={frameRef}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts"
      srcDoc={source}
      style={{ height }}
      title={title}
    />
  );
}
