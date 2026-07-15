"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./RawHtmlFrame.module.css";
import {
  buildRawHtmlSource,
  RAW_HTML_HEIGHT_MESSAGE_TYPE,
  RAW_HTML_MEASURE_REQUEST_TYPE,
} from "./raw-html-source";

export { buildRawHtmlSource } from "./raw-html-source";

const MIN_HEIGHT = 160;

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
  const requestHeight = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: RAW_HTML_MEASURE_REQUEST_TYPE },
      "*",
    );
  }, []);

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
      setHeight(Math.max(MIN_HEIGHT, Math.ceil(data.height)));
    };
    window.addEventListener("message", onMessage);
    requestHeight();
    return () => window.removeEventListener("message", onMessage);
  }, [requestHeight]);

  return (
    <iframe
      className={styles.frame}
      onLoad={requestHeight}
      ref={frameRef}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts"
      scrolling="no"
      srcDoc={source}
      style={{ height }}
      title={title}
    />
  );
}
