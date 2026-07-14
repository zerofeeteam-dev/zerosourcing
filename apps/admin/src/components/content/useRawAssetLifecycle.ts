import { useCallback, useEffect, useRef, useState } from "react";
import { AdminFailureError } from "../../lib/adminErrors";
import {
  removeContentAsset,
  uploadRawHtmlAsset,
  type ContentEntity,
  type RawHtmlAssetUpload,
} from "../../lib/contentAssetStorage";
import { supabaseConfig } from "../../lib/supabase";
import type { AdminChoiceRequest } from "./AdminChoiceDialog";
import {
  createPendingAssetProducerKey,
  type PendingAssetWork,
  type PendingAssetProducerKey,
} from "./generationPendingAssetRegistry";
import {
  createRawAssetReviewItems,
  updateRawAssetReviewItem,
  type RawAssetReviewItem,
} from "./rawAssetReview";

export type RawAssetCleanupIssue = {
  readonly generation: string;
  readonly message: string;
  readonly path: string;
};

export type RawPendingAssetWork = PendingAssetWork;

type RawAssetLifecycleOptions = {
  readonly contentAssetBaseEnabled: boolean;
  readonly contentAssetScope: string;
  readonly disabled: boolean;
  readonly editorGeneration: string;
  readonly entity: ContentEntity;
  readonly onEnableAssetBase: () => void;
  readonly onOrphanCleanupIssue: (issue: RawAssetCleanupIssue) => void;
  readonly onPendingAssetWorkChange: (event: RawPendingAssetWork) => void;
  readonly openDialog: (request: AdminChoiceRequest) => void;
};

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof AdminFailureError ? error.failure.message : fallback;
}

export function useRawAssetLifecycle({
  contentAssetBaseEnabled,
  contentAssetScope,
  disabled,
  editorGeneration,
  entity,
  onEnableAssetBase,
  onOrphanCleanupIssue,
  onPendingAssetWorkChange,
  openDialog,
}: RawAssetLifecycleOptions) {
  const activeGenerationRef = useRef(editorGeneration);
  activeGenerationRef.current = editorGeneration;
  const previousGenerationRef = useRef(editorGeneration);
  const relativeBaseDecisionGenerationRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const onEnableAssetBaseRef = useRef(onEnableAssetBase);
  onEnableAssetBaseRef.current = onEnableAssetBase;
  const onOrphanCleanupIssueRef = useRef(onOrphanCleanupIssue);
  onOrphanCleanupIssueRef.current = onOrphanCleanupIssue;
  const onPendingAssetWorkChangeRef = useRef(onPendingAssetWorkChange);
  onPendingAssetWorkChangeRef.current = onPendingAssetWorkChange;

  const [assets, setAssets] = useState<readonly RawAssetReviewItem[]>([]);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingCountRef = useRef(0);
  const pendingByGenerationRef = useRef(new Map<string, number>());
  const producerByGenerationRef = useRef(
    new Map<string, PendingAssetProducerKey>(),
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (previousGenerationRef.current === editorGeneration) return;
    previousGenerationRef.current = editorGeneration;
    relativeBaseDecisionGenerationRef.current = null;
    setAssetError(null);
    setAssets([]);
  }, [editorGeneration]);

  const adjustPendingCount = useCallback(
    (generation: string, delta: number) => {
      const counts = pendingByGenerationRef.current;
      const producers = producerByGenerationRef.current;
      const producerKey =
        producers.get(generation) ?? createPendingAssetProducerKey();
      const nextCount = Math.max(0, (counts.get(generation) ?? 0) + delta);
      if (nextCount === 0) {
        counts.delete(generation);
        producers.delete(generation);
      } else {
        counts.set(generation, nextCount);
        producers.set(generation, producerKey);
      }

      let total = 0;
      for (const count of counts.values()) total += count;
      pendingCountRef.current = total;
      if (mountedRef.current) setPendingCount(total);
      onPendingAssetWorkChangeRef.current({
        count: nextCount,
        generation,
        producerKey,
      });
    },
    [],
  );

  const cleanupUpload = useCallback(async (upload: RawHtmlAssetUpload) => {
    const result = await removeContentAsset(supabaseConfig, {
      assetScope: upload.assetScope,
      entity: upload.entity,
      path: upload.path,
    });
    if (!result.ok) throw new AdminFailureError(result.error);
  }, []);

  const reportStaleCleanupIssue = useCallback(
    (generation: string, path: string, error: unknown) => {
      onOrphanCleanupIssueRef.current({
        generation,
        message: failureMessage(
          error,
          "이전 문서의 고립 asset을 자동 정리하지 못했습니다.",
        ),
        path,
      });
    },
    [],
  );

  const uploadItem = useCallback(
    async (item: RawAssetReviewItem, generation: string, scope: string) => {
      adjustPendingCount(generation, 1);
      try {
        const result = await uploadRawHtmlAsset(supabaseConfig, {
          assetScope: scope,
          entity,
          file: item.file,
          relativePath: item.relativePath,
        });
        if (!result.ok) {
          if (
            mountedRef.current &&
            activeGenerationRef.current === generation
          ) {
            setAssets((current) =>
              updateRawAssetReviewItem(current, item.id, {
                errorMessage: result.error.message,
                status: "error",
              }),
            );
          }
          return;
        }

        if (!mountedRef.current || activeGenerationRef.current !== generation) {
          try {
            await cleanupUpload(result.value);
          } catch (error) {
            reportStaleCleanupIssue(generation, result.value.path, error);
          }
          return;
        }
        setAssetError(null);
        setAssets((current) =>
          updateRawAssetReviewItem(current, item.id, {
            errorMessage: null,
            path: result.value.path,
            publicUrl: result.value.publicUrl,
            relativePath: result.value.relativePath,
            status: "uploaded",
          }),
        );
      } catch (error) {
        if (mountedRef.current && activeGenerationRef.current === generation) {
          setAssets((current) =>
            updateRawAssetReviewItem(current, item.id, {
              errorMessage: failureMessage(
                error,
                "본문 asset 업로드에 실패했습니다. 다시 시도해 주세요.",
              ),
              status: "error",
            }),
          );
        }
      } finally {
        adjustPendingCount(generation, -1);
      }
    },
    [adjustPendingCount, cleanupUpload, entity, reportStaleCleanupIssue],
  );

  const beginUploads = useCallback(
    (enableAssetBase: boolean) => {
      if (disabled) return;
      const candidates = assets.filter(
        (item) => item.status === "ready" || item.status === "error",
      );
      if (candidates.length === 0) {
        setAssetError("업로드할 asset 파일을 먼저 선택해 주세요.");
        return;
      }
      if (enableAssetBase && !contentAssetBaseEnabled) {
        onEnableAssetBaseRef.current();
      }
      setAssetError(null);
      const candidateIds = new Set(candidates.map((item) => item.id));
      setAssets((current) =>
        current.map((item) =>
          candidateIds.has(item.id)
            ? { ...item, errorMessage: null, status: "uploading" }
            : item,
        ),
      );
      for (const item of candidates) {
        void uploadItem(item, editorGeneration, contentAssetScope);
      }
    },
    [
      assets,
      contentAssetBaseEnabled,
      contentAssetScope,
      disabled,
      editorGeneration,
      uploadItem,
    ],
  );

  const requestUploads = useCallback(() => {
    if (disabled || pendingCountRef.current > 0) return;
    if (
      !contentAssetBaseEnabled &&
      relativeBaseDecisionGenerationRef.current !== editorGeneration
    ) {
      openDialog({
        choices: [
          {
            description:
              "미리보기와 공개 화면에서 images/... 같은 경로를 현재 Storage scope로 해석합니다.",
            id: "enable_and_upload",
            label: "상대경로 기준 사용 후 업로드",
          },
          {
            description:
              "파일만 업로드하고 HTML의 URL 해석 방식은 바꾸지 않습니다.",
            id: "upload_only",
            label: "기준 없이 업로드",
          },
        ],
        description:
          "상대 경로 asset을 올립니다. 이 HTML이 Storage 상대경로 기준을 사용할지 선택해 주세요.",
        onSelect: (choiceId) => {
          if (choiceId === "enable_and_upload") {
            relativeBaseDecisionGenerationRef.current = editorGeneration;
            beginUploads(true);
          }
          if (choiceId === "upload_only") {
            relativeBaseDecisionGenerationRef.current = editorGeneration;
            beginUploads(false);
          }
        },
        title: "Storage 상대경로 기준",
      });
      return;
    }
    beginUploads(false);
  }, [
    beginUploads,
    contentAssetBaseEnabled,
    disabled,
    editorGeneration,
    openDialog,
  ]);

  const addFiles = useCallback((files: readonly File[]) => {
    if (files.length === 0) return;
    setAssets((current) => [...current, ...createRawAssetReviewItems(files)]);
    setAssetError(null);
  }, []);

  const setRelativePath = useCallback((id: string, relativePath: string) => {
    setAssets((current) =>
      updateRawAssetReviewItem(current, id, { relativePath }),
    );
  }, []);

  const removeAsset = useCallback(
    async (item: RawAssetReviewItem) => {
      if (
        disabled ||
        item.status === "uploading" ||
        item.status === "removing"
      ) {
        return;
      }
      if (item.status !== "uploaded" || !item.path) {
        setAssets((current) => current.filter((entry) => entry.id !== item.id));
        return;
      }

      const generation = editorGeneration;
      setAssetError(null);
      setAssets((current) =>
        updateRawAssetReviewItem(current, item.id, {
          errorMessage: null,
          status: "removing",
        }),
      );
      adjustPendingCount(generation, 1);
      try {
        const result = await removeContentAsset(supabaseConfig, {
          assetScope: contentAssetScope,
          entity,
          path: item.path,
        });
        if (!mountedRef.current || activeGenerationRef.current !== generation) {
          if (!result.ok) {
            reportStaleCleanupIssue(
              generation,
              item.path,
              new AdminFailureError(result.error),
            );
          }
          return;
        }
        if (!result.ok) {
          setAssets((current) =>
            updateRawAssetReviewItem(current, item.id, {
              errorMessage: result.error.message,
              status: "uploaded",
            }),
          );
          return;
        }
        setAssetError(null);
        setAssets((current) => current.filter((entry) => entry.id !== item.id));
      } catch (error) {
        if (!mountedRef.current || activeGenerationRef.current !== generation) {
          reportStaleCleanupIssue(generation, item.path, error);
        } else {
          setAssets((current) =>
            updateRawAssetReviewItem(current, item.id, {
              errorMessage: failureMessage(
                error,
                "본문 asset을 정리하지 못했습니다.",
              ),
              status: "uploaded",
            }),
          );
        }
      } finally {
        adjustPendingCount(generation, -1);
      }
    },
    [
      adjustPendingCount,
      contentAssetScope,
      disabled,
      editorGeneration,
      entity,
      reportStaleCleanupIssue,
    ],
  );

  const hasPendingWork = useCallback(() => pendingCountRef.current > 0, []);

  return {
    addFiles,
    assetError,
    assets,
    hasPendingWork,
    pendingCount,
    removeAsset,
    requestUploads,
    setRelativePath,
  } as const;
}
