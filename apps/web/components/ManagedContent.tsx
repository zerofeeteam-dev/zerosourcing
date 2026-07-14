import "server-only";

import type { ContentEntity } from "@repo/content/asset-url";
import { RawHtmlFrame } from "@repo/content/raw-html-frame";
import type {
  ContentAuthoringMode,
  ContentOutputMode,
} from "@repo/content/types";
import { contentAssetBaseUrl } from "../lib/public-content/config";
import { sanitizeRichContent } from "../lib/public-content/sanitize-rich-content";
import styles from "./ManagedContent.module.css";

type ManagedContentProps = {
  readonly assetBaseEnabled: boolean;
  readonly assetScope: string;
  readonly authoringMode: ContentAuthoringMode;
  readonly content: string;
  readonly entity: ContentEntity;
  readonly outputMode: ContentOutputMode;
  readonly title: string;
};

export function ManagedContent(props: ManagedContentProps) {
  if (props.outputMode === "text") {
    return <p className={styles.plainText}>{props.content}</p>;
  }

  if (props.authoringMode === "raw_html") {
    return (
      <RawHtmlFrame
        assetBaseUrl={
          props.assetBaseEnabled
            ? contentAssetBaseUrl(props.entity, props.assetScope)
            : undefined
        }
        html={props.content}
        title={props.title}
      />
    );
  }

  const allowedImageBaseUrl = contentAssetBaseUrl(
    props.entity,
    props.assetScope,
  );
  const sanitizedContent = sanitizeRichContent(props.content, {
    allowedImageBaseUrl,
  });

  return (
    <div
      className="rich-content"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
