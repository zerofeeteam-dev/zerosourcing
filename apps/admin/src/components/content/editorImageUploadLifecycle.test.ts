import { describe, expect, it } from "vitest";
import {
  planTerminalImageReconciliation,
  type TerminalImageCandidate,
  type TerminalImageDisposition,
} from "./editorImageUploadLifecycle";

const candidate: TerminalImageCandidate = {
  attrs: {
    alt: "preview",
    altReviewed: false,
    decorative: false,
    src: "blob:revoked-preview",
    uploadId: "upload-1",
  },
  nodeSize: 1,
  position: 3,
  uploadId: "upload-1",
};

const uploadedImage = {
  alt: "uploaded",
  path: "content/blog/scope/images/uploaded.png",
  url: "https://storage.example.com/content/blog/scope/images/uploaded.png",
};

describe("terminal image reconciliation", () => {
  it("gives a cleanup tombstone precedence even while other work is active", () => {
    const dispositions = new Map<string, TerminalImageDisposition>([
      ["upload-1", { kind: "remove" }],
    ]);

    expect(
      planTerminalImageReconciliation(
        [candidate],
        dispositions,
        new Set(["upload-1", "upload-2"]),
      ),
    ).toEqual([{ kind: "remove", nodeSize: 1, position: 3 }]);
  });

  it("normalizes a restored preview but keeps identity until active work settles", () => {
    const dispositions = new Map<string, TerminalImageDisposition>([
      ["upload-1", { image: uploadedImage, kind: "normalize" }],
    ]);

    expect(
      planTerminalImageReconciliation(
        [candidate],
        dispositions,
        new Set(["upload-1"]),
      ),
    ).toEqual([
      {
        attributes: {
          ...candidate.attrs,
          alt: "uploaded",
          src: uploadedImage.url,
          uploadId: "upload-1",
        },
        kind: "normalize",
        position: 3,
      },
    ]);
  });

  it("clears terminal identity when restoring a completed successful image", () => {
    const dispositions = new Map<string, TerminalImageDisposition>([
      ["upload-1", { image: uploadedImage, kind: "normalize" }],
    ]);

    const [reconciliation] = planTerminalImageReconciliation(
      [candidate],
      dispositions,
      new Set(),
    );
    expect(reconciliation).toEqual({
      attributes: {
        ...candidate.attrs,
        alt: "uploaded",
        src: uploadedImage.url,
        uploadId: null,
      },
      kind: "normalize",
      position: 3,
    });
    expect(JSON.stringify(reconciliation)).not.toContain("blob:revoked-preview");
  });
});
