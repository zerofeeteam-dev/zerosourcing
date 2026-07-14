import type { TiptapDocument } from "@repo/content/types";
import type { Editor } from "@tiptap/core";
import {
  isManagedEditorImageFile,
  type CleanupOrphanedEditorImage,
  type EditorImageInsertionPosition,
  type OrphanedEditorImageReason,
  type UploadedEditorImage,
  type UploadEditorImage,
} from "./contentEditorExtensions";
import { isAllowedManagedImageUrl } from "./managedEditorDocument";

/**
 * Cardinality of unfinished asset lifecycle work, including replacement and
 * orphan cleanup. Integrations must use `count > 0` only as a busy signal.
 */
export type PendingEditorAssetWork = {
  readonly count: number;
  readonly documentKey: string;
};

export type EditorRuntime = {
  active: boolean;
  contentErrorReported: boolean;
  created: boolean;
  editor: Editor | null;
  readonly documentKey: string;
  readonly id: number;
  readonly initialDocument: TiptapDocument;
  invalidated: boolean;
  readonly isAllowedImageUrl: (url: string) => boolean;
  lastCleanFingerprint: string | null;
};

type PendingImageUpload = {
  cleanupPromise: Promise<void> | null;
  cleanupReason: OrphanedEditorImageReason | null;
  readonly cleanupOrphanedImage: CleanupOrphanedEditorImage;
  readonly editor: Editor;
  readonly file: File;
  readonly objectUrl: string;
  objectUrlRevoked: boolean;
  readonly onUploadError: (error: unknown) => void;
  readonly runtime: EditorRuntime;
  uploadedImage: UploadedEditorImage | null;
  uploadFailed: boolean;
  readonly uploadId: string;
  readonly uploadImage: UploadEditorImage;
  uploadSettled: boolean;
};

type ImageUploadLifecycleCallbacks = {
  readonly clearUploadError: (runtime: EditorRuntime) => void;
  readonly emitCanonicalChange: (
    runtime: EditorRuntime,
    editor: Editor,
  ) => void;
  readonly getCleanupOrphanedImage: () => CleanupOrphanedEditorImage;
  readonly getCurrentRuntime: () => EditorRuntime;
  readonly getOnUploadError: () => (error: unknown) => void;
  readonly getUploadImage: () => UploadEditorImage;
  readonly notifyPendingAssetWork: (event: PendingEditorAssetWork) => void;
  readonly showUploadError: (runtime: EditorRuntime) => void;
};

export type TerminalImageDisposition =
  | { readonly kind: "remove" }
  | {
      readonly image: UploadedEditorImage;
      readonly kind: "normalize";
    };

export type TerminalImageCandidate = {
  readonly attrs: Readonly<Record<string, unknown>>;
  readonly nodeSize: number;
  readonly position: number;
  readonly uploadId: string;
};

export type TerminalImageReconciliation =
  | {
      readonly kind: "remove";
      readonly nodeSize: number;
      readonly position: number;
    }
  | {
      readonly attributes: Readonly<Record<string, unknown>>;
      readonly kind: "normalize";
      readonly position: number;
    };

export function planTerminalImageReconciliation(
  candidates: readonly TerminalImageCandidate[],
  dispositions: ReadonlyMap<string, TerminalImageDisposition>,
  activeUploadIds: ReadonlySet<string>,
): TerminalImageReconciliation[] {
  const reconciliations: TerminalImageReconciliation[] = [];

  for (const candidate of candidates) {
    const disposition = dispositions.get(candidate.uploadId);
    if (!disposition) continue;
    if (disposition.kind === "remove") {
      reconciliations.push({
        kind: "remove",
        nodeSize: candidate.nodeSize,
        position: candidate.position,
      });
      continue;
    }

    const uploadId = activeUploadIds.has(candidate.uploadId)
      ? candidate.uploadId
      : null;
    const attributes = {
      ...candidate.attrs,
      alt: disposition.image.alt,
      altReviewed: false,
      decorative: false,
      src: disposition.image.url,
      uploadId,
    };
    if (
      candidate.attrs.alt === attributes.alt &&
      candidate.attrs.altReviewed === attributes.altReviewed &&
      candidate.attrs.decorative === attributes.decorative &&
      candidate.attrs.src === attributes.src &&
      candidate.attrs.uploadId === attributes.uploadId
    ) {
      continue;
    }
    reconciliations.push({
      attributes,
      kind: "normalize",
      position: candidate.position,
    });
  }

  return reconciliations.sort((left, right) => right.position - left.position);
}

export function safelyCall<TArgs extends readonly unknown[]>(
  callback: (...args: TArgs) => void,
  ...args: TArgs
) {
  try {
    callback(...args);
  } catch {
    // Consumer handlers must not turn a handled lifecycle result into an
    // unhandled promise rejection.
  }
}

function findManagedImage(
  editor: Editor,
  uploadId: string,
): { readonly nodeSize: number; readonly position: number } | null {
  let match: { nodeSize: number; position: number } | null = null;
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
      match = { nodeSize: node.nodeSize, position };
      return false;
    }
    return match === null;
  });
  return match;
}

function provisionalImageAlt(file: File): string {
  return file.name.replace(/\.[^.]+$/, "");
}

export class ImageUploadLifecycle {
  private readonly callbacks: ImageUploadLifecycleCallbacks;

  private readonly entries = new Map<string, PendingImageUpload>();

  private readonly finalizingRuntimeIds = new Set<number>();

  private readonly terminalByRuntime = new Map<
    number,
    Map<string, TerminalImageDisposition>
  >();

  constructor(callbacks: ImageUploadLifecycleCallbacks) {
    this.callbacks = callbacks;
  }

  hasPending(runtime: EditorRuntime): boolean {
    return this.entriesFor(runtime).length > 0;
  }

  invalidate(runtime: EditorRuntime) {
    if (runtime.invalidated) return;
    runtime.invalidated = true;
    this.terminalByRuntime.delete(runtime.id);

    for (const entry of this.entriesFor(runtime)) {
      this.revokeObjectUrl(entry);
      if (entry.uploadedImage) {
        void this.ensureCleanup(entry, "editor_replaced");
      }
    }

    void this.maybeFinalize(runtime);
  }

  reconcileTerminalState(runtime: EditorRuntime, editor: Editor): boolean {
    if (
      runtime.invalidated ||
      runtime.editor !== editor ||
      editor.isDestroyed
    ) {
      return false;
    }
    const dispositions = this.terminalByRuntime.get(runtime.id);
    if (!dispositions || dispositions.size === 0) return false;

    const candidates: TerminalImageCandidate[] = [];
    editor.state.doc.descendants((node, position) => {
      const uploadId = node.attrs.uploadId;
      if (
        node.type.name === "image" &&
        typeof uploadId === "string" &&
        dispositions.has(uploadId)
      ) {
        candidates.push({
          attrs: node.attrs,
          nodeSize: node.nodeSize,
          position,
          uploadId,
        });
      }
    });
    if (candidates.length === 0) return false;

    const activeUploadIds = new Set(
      this.entriesFor(runtime).map((entry) => entry.uploadId),
    );
    const reconciliations = planTerminalImageReconciliation(
      candidates,
      dispositions,
      activeUploadIds,
    );
    if (reconciliations.length === 0) return false;

    let transaction = editor.state.tr;
    let changed = false;
    for (const reconciliation of reconciliations) {
      const node = transaction.doc.nodeAt(reconciliation.position);
      if (!node || node.type.name !== "image") continue;
      if (reconciliation.kind === "remove") {
        transaction = transaction.delete(
          reconciliation.position,
          reconciliation.position + reconciliation.nodeSize,
        );
      } else {
        transaction = transaction.setNodeMarkup(
          reconciliation.position,
          undefined,
          reconciliation.attributes,
        );
      }
      changed = true;
    }
    if (!changed) return false;

    editor.view.dispatch(transaction.setMeta("addToHistory", false));
    return true;
  }

  start(
    runtime: EditorRuntime,
    editor: Editor,
    files: readonly File[],
    position: EditorImageInsertionPosition,
  ) {
    const acceptedFiles = files.filter(isManagedEditorImageFile);
    if (acceptedFiles.length === 0 || runtime.invalidated) return;

    const createdEntries: PendingImageUpload[] = [];
    try {
      for (const file of acceptedFiles) {
        const uploadId = crypto.randomUUID();
        createdEntries.push({
          cleanupOrphanedImage: this.callbacks.getCleanupOrphanedImage(),
          cleanupPromise: null,
          cleanupReason: null,
          editor,
          file,
          objectUrl: URL.createObjectURL(file),
          objectUrlRevoked: false,
          onUploadError: this.callbacks.getOnUploadError(),
          runtime,
          uploadedImage: null,
          uploadFailed: false,
          uploadId,
          uploadImage: this.callbacks.getUploadImage(),
          uploadSettled: false,
        });
      }
    } catch (error) {
      for (const entry of createdEntries) this.revokeObjectUrl(entry);
      this.reportUploadError(runtime, this.callbacks.getOnUploadError(), error);
      return;
    }

    for (const entry of createdEntries) {
      this.entries.set(entry.uploadId, entry);
    }
    this.notifyPendingAssetWork(runtime);
    this.callbacks.clearUploadError(runtime);

    let inserted = false;
    try {
      inserted = editor.commands.insertContentAt(
        position,
        createdEntries.map((entry) => ({
          attrs: {
            alt: provisionalImageAlt(entry.file),
            altReviewed: false,
            decorative: false,
            src: entry.objectUrl,
            uploadId: entry.uploadId,
          },
          type: "image",
        })),
      );
    } catch (error) {
      this.cancelUninserted(runtime, createdEntries, error);
      return;
    }

    if (!inserted) {
      this.cancelUninserted(
        runtime,
        createdEntries,
        new Error("The editor rejected the image placeholders."),
      );
      return;
    }

    for (const entry of createdEntries) {
      void this.upload(entry);
    }
  }

  private cancelUninserted(
    runtime: EditorRuntime,
    entries: readonly PendingImageUpload[],
    error: unknown,
  ) {
    for (const entry of entries) {
      this.entries.delete(entry.uploadId);
      this.revokeObjectUrl(entry);
    }
    this.notifyPendingAssetWork(runtime);
    this.reportUploadError(runtime, this.callbacks.getOnUploadError(), error);
  }

  private entriesFor(runtime: EditorRuntime): PendingImageUpload[] {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.runtime === runtime,
    );
  }

  private isLive(entry: PendingImageUpload): boolean {
    return (
      entry.runtime.active &&
      !entry.runtime.invalidated &&
      entry.runtime.editor === entry.editor &&
      !entry.editor.isDestroyed &&
      this.callbacks.getCurrentRuntime() === entry.runtime
    );
  }

  private registerTerminal(
    entry: PendingImageUpload,
    disposition: TerminalImageDisposition,
  ) {
    if (entry.runtime.invalidated) return;
    let dispositions = this.terminalByRuntime.get(entry.runtime.id);
    if (!dispositions) {
      dispositions = new Map();
      this.terminalByRuntime.set(entry.runtime.id, dispositions);
    }
    const current = dispositions.get(entry.uploadId);
    if (current?.kind === "remove") return;
    if (disposition.kind === "remove" || !current) {
      dispositions.set(entry.uploadId, disposition);
    }
  }

  private notifyPendingAssetWork(runtime: EditorRuntime) {
    safelyCall(this.callbacks.notifyPendingAssetWork, {
      count: this.entriesFor(runtime).length,
      documentKey: runtime.documentKey,
    });
  }

  private reportUploadError(
    runtime: EditorRuntime,
    callback: (error: unknown) => void,
    error: unknown,
  ) {
    safelyCall(callback, error);
    this.callbacks.showUploadError(runtime);
  }

  private revokeObjectUrl(entry: PendingImageUpload) {
    if (entry.objectUrlRevoked) return;
    entry.objectUrlRevoked = true;
    try {
      URL.revokeObjectURL(entry.objectUrl);
    } catch (error) {
      this.reportUploadError(entry.runtime, entry.onUploadError, error);
    }
  }

  private removePlaceholder(entry: PendingImageUpload) {
    if (!this.isLive(entry)) return;
    const match = findManagedImage(entry.editor, entry.uploadId);
    if (!match) return;
    entry.editor.view.dispatch(
      entry.editor.state.tr
        .delete(match.position, match.position + match.nodeSize)
        .setMeta("addToHistory", false),
    );
  }

  private replacePlaceholder(
    entry: PendingImageUpload,
    uploaded: UploadedEditorImage,
  ): boolean {
    if (!this.isLive(entry)) return false;
    const match = findManagedImage(entry.editor, entry.uploadId);
    if (!match) return false;
    const node = entry.editor.state.doc.nodeAt(match.position);
    if (!node) return false;
    entry.editor.view.dispatch(
      entry.editor.state.tr
        .setNodeMarkup(match.position, undefined, {
          ...node.attrs,
          alt: uploaded.alt,
          altReviewed: false,
          decorative: false,
          src: uploaded.url,
        })
        .setMeta("addToHistory", false),
    );
    return true;
  }

  private async upload(entry: PendingImageUpload) {
    try {
      const uploaded = await entry.uploadImage(entry.file);
      entry.uploadedImage = uploaded;

      if (!this.isLive(entry)) {
        await this.ensureCleanup(entry, "editor_replaced");
      } else if (
        !isAllowedManagedImageUrl(
          uploaded.url,
          entry.runtime.isAllowedImageUrl,
        )
      ) {
        entry.uploadFailed = true;
        this.registerTerminal(entry, { kind: "remove" });
        this.removePlaceholder(entry);
        this.reportUploadError(
          entry.runtime,
          entry.onUploadError,
          new Error("The uploaded image URL is not allowed for this document."),
        );
        await this.ensureCleanup(entry, "placeholder_deleted");
      } else if (this.replacePlaceholder(entry, uploaded)) {
        this.registerTerminal(entry, { image: uploaded, kind: "normalize" });
      } else {
        await this.ensureCleanup(entry, "placeholder_deleted");
      }
    } catch (error) {
      entry.uploadFailed = true;
      this.registerTerminal(entry, { kind: "remove" });
      this.removePlaceholder(entry);
      this.reportUploadError(entry.runtime, entry.onUploadError, error);
    } finally {
      entry.uploadSettled = true;
      this.revokeObjectUrl(entry);
      await this.maybeFinalize(entry.runtime);
    }
  }

  private ensureCleanup(
    entry: PendingImageUpload,
    reason: OrphanedEditorImageReason,
  ): Promise<void> {
    if (reason === "placeholder_deleted") {
      this.registerTerminal(entry, { kind: "remove" });
    }
    if (!entry.uploadedImage) return Promise.resolve();
    if (entry.cleanupPromise) return entry.cleanupPromise;

    entry.cleanupReason = reason;
    const uploaded = entry.uploadedImage;
    entry.cleanupPromise = Promise.resolve()
      .then(() => entry.cleanupOrphanedImage(uploaded, reason))
      .catch((error: unknown) => {
        this.reportUploadError(entry.runtime, entry.onUploadError, error);
      });
    return entry.cleanupPromise;
  }

  private async maybeFinalize(runtime: EditorRuntime) {
    if (this.finalizingRuntimeIds.has(runtime.id)) return;
    if (
      this.entriesFor(runtime).some(
        (entry) => !entry.uploadSettled || Boolean(entry.cleanupPromise),
      )
    ) {
      const cleanupPromises = this.entriesFor(runtime)
        .map((entry) => entry.cleanupPromise)
        .filter((promise): promise is Promise<void> => promise !== null);
      if (cleanupPromises.length > 0) await Promise.all(cleanupPromises);
      if (this.entriesFor(runtime).some((entry) => !entry.uploadSettled)) return;
    }

    this.finalizingRuntimeIds.add(runtime.id);
    try {
      while (true) {
        const entries = this.entriesFor(runtime);
        if (entries.length === 0 || entries.some((entry) => !entry.uploadSettled)) {
          return;
        }

        const cleanupPromises: Promise<void>[] = [];
        for (const entry of entries) {
          if (!entry.uploadedImage || entry.cleanupReason) continue;
          if (!this.isLive(entry)) {
            cleanupPromises.push(
              this.ensureCleanup(entry, "editor_replaced"),
            );
          } else if (!findManagedImage(entry.editor, entry.uploadId)) {
            cleanupPromises.push(
              this.ensureCleanup(entry, "placeholder_deleted"),
            );
          }
        }
        if (cleanupPromises.length > 0) {
          await Promise.all(cleanupPromises);
          continue;
        }

        if (
          runtime.invalidated ||
          !runtime.active ||
          this.callbacks.getCurrentRuntime() !== runtime ||
          !runtime.editor ||
          runtime.editor.isDestroyed
        ) {
          for (const entry of entries) this.entries.delete(entry.uploadId);
          this.notifyPendingAssetWork(runtime);
          return;
        }

        const editor = runtime.editor;
        let transaction = editor.state.tr;
        let changed = false;
        let missingSuccessfulImage = false;
        for (const entry of entries) {
          if (!entry.uploadedImage || entry.uploadFailed) {
            this.registerTerminal(entry, { kind: "remove" });
            continue;
          }
          let position: number | null = null;
          transaction.doc.descendants((node, nodePosition) => {
            if (
              node.type.name === "image" &&
              node.attrs.uploadId === entry.uploadId
            ) {
              position = nodePosition;
              return false;
            }
            return position === null;
          });
          if (position === null) {
            if (entry.cleanupReason) continue;
            missingSuccessfulImage = true;
            await this.ensureCleanup(entry, "placeholder_deleted");
            break;
          }
          const node = transaction.doc.nodeAt(position);
          if (!node) continue;
          if (entry.cleanupReason) {
            this.registerTerminal(entry, { kind: "remove" });
            transaction = transaction.delete(
              position,
              position + node.nodeSize,
            );
            changed = true;
            continue;
          }
          this.registerTerminal(entry, {
            image: entry.uploadedImage,
            kind: "normalize",
          });
          transaction = transaction.setNodeMarkup(position, undefined, {
            ...node.attrs,
            uploadId: null,
          });
          changed = true;
        }
        if (missingSuccessfulImage) continue;
        if (changed) {
          editor.view.dispatch(transaction.setMeta("addToHistory", false));
        }

        for (const entry of entries) this.entries.delete(entry.uploadId);
        this.notifyPendingAssetWork(runtime);
        this.callbacks.emitCanonicalChange(runtime, editor);
        return;
      }
    } finally {
      this.finalizingRuntimeIds.delete(runtime.id);
    }
  }
}
