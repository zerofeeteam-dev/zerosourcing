import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdminArrowRightIcon,
  AdminButton,
  AdminTrashIcon,
} from "../../components/admin";
import {
  adminFailureMessage,
  networkFailure,
  saveFailure,
} from "../../lib/adminErrors";
import type {
  BlogPostCreateInput,
  BlogPostRow,
  BlogPostStatus,
} from "../../lib/adminRepositoryTypes";
import { ManagedContentSchemaError } from "../../lib/managedContent";
import {
  createOperationGeneration,
  type OperationGeneration,
  type OperationToken,
} from "../../lib/operationGeneration";
import { adminErr } from "../../lib/adminTypes";
import {
  createBlogPost,
  getBlogPostBySlug,
  updateBlogPost,
} from "../../lib/blogRepository";
import { deleteBlogPostWithStorageCleanup } from "../../lib/blogDeletion";
import { revalidatePublicContent } from "../../lib/publicContentRevalidation";
import { supabaseConfig } from "../../lib/supabase";
import { persistThumbnailChange } from "../../lib/thumbnailPersistence";
import { usePendingAssetRegistration } from "../../navigation/PendingAssetNavigation";
import {
  managedContentActionBlockReason,
  thumbnailCleanupWarning,
} from "../content/managedContentFormFeedback";
import { validateManagedContentImagesForPublish } from "../content/managedContentPublishValidation";
import { useAdminThumbnailSelection } from "../content/useAdminThumbnailSelection";
import { useAdminFormFailureNavigation } from "../content/useAdminFormFailureNavigation";
import { useManagedContentEditorState } from "../content/useManagedContentEditorState";
import { useManagedContentFormState } from "../content/useManagedContentFormState";
import { BlogFormFields } from "./BlogFormFields";
import { BlogMessage } from "./BlogMessage";
import {
  blogFailureToErrors,
  blogFormFromRow,
  blogFormWithStatus,
  createEmptyBlogFormState,
  validateBlogForm,
} from "./blogModel";
import type {
  BlogFieldErrors,
  BlogFormRoute,
  BlogFormState,
} from "./blogTypes";
import styles from "../BlogAdminPage.module.css";

type BlogFormPageProps = {
  readonly onNavigate: (path: string) => void;
  readonly route: BlogFormRoute;
};

export function BlogFormPage({ onNavigate, route }: BlogFormPageProps) {
  const isNewRoute = route.id === "blogNew";
  const detailParam = route.id === "blogDetail" ? route.param : null;
  const routeKey = detailParam ? `blog:detail:${detailParam}` : "blog:new";
  const formOwner = useManagedContentFormState<BlogFormState>({
    createEmptyForm: createEmptyBlogFormState,
    entity: "blog",
  });
  const editorState = useManagedContentEditorState(
    formOwner.documentKey,
    formOwner.documentIsCurrent,
  );
  const thumbnail = useAdminThumbnailSelection();
  const acceptLoadedForm = formOwner.acceptLoaded;
  const beginFormLoad = formOwner.beginLoad;
  const invalidateFormLoads = formOwner.invalidateLoads;
  const formLoadIsCurrent = formOwner.loadIsCurrent;
  const formMatchesCurrentRoute = formOwner.matchesCurrentRoute;
  const replaceWithNewForm = formOwner.replaceWithNew;
  const resetThumbnail = thumbnail.reset;

  const [detailState, setDetailState] = useState<"idle" | "loading" | "ready">(
    "idle",
  );
  const [editingPost, setEditingPost] = useState<BlogPostRow | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BlogFieldErrors>({});
  const [globalError, setGlobalError] = useState<string>();
  const [cleanupWarning, setCleanupWarning] = useState<string>();
  const [contentSchemaError, setContentSchemaError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contentPreviewContainer, setContentPreviewContainer] =
    useState<HTMLDivElement | null>(null);

  usePendingAssetRegistration(editorState.pendingAssetCount);
  const { formRef, requestFailureNavigation } = useAdminFormFailureNavigation();

  const mutationControllerRef = useRef<AbortController | null>(null);
  const operationGenerationRef = useRef<OperationGeneration | null>(null);
  if (operationGenerationRef.current === null) {
    operationGenerationRef.current = createOperationGeneration();
  }
  const operationGeneration = operationGenerationRef.current;
  const currentRouteKeyRef = useRef(routeKey);
  currentRouteKeyRef.current = routeKey;
  const operationIsCurrent = (operation: OperationToken) =>
    operationGeneration.isCurrent(operation, currentRouteKeyRef.current);
  const previousRouteKeyRef = useRef(routeKey);

  const hasCurrentEditingPost =
    route.id === "blogDetail" &&
    editingPost !== null &&
    editingPost.id === formOwner.recordId &&
    formOwner.routeParam === route.param;

  const setContentPreviewContainerRef = useCallback(
    (element: HTMLDivElement | null) => {
      setContentPreviewContainer((current) =>
        current === element ? current : element,
      );
    },
    [],
  );

  useEffect(() => {
    mutationControllerRef.current?.abort();
    mutationControllerRef.current = null;
    operationGeneration.invalidate();
    setIsSaving(false);
    setIsDeleting(false);

    return () => {
      mutationControllerRef.current?.abort();
      mutationControllerRef.current = null;
      operationGeneration.invalidate();
    };
  }, [operationGeneration, routeKey]);

  useEffect(() => {
    const routeChanged = previousRouteKeyRef.current !== routeKey;
    previousRouteKeyRef.current = routeKey;
    if (!isNewRoute) return;

    invalidateFormLoads();
    if (routeChanged) replaceWithNewForm();
    setEditingPost(null);
    resetThumbnail();
    setFieldErrors({});
    setGlobalError(undefined);
    setCleanupWarning(undefined);
    setContentSchemaError(undefined);
    setDetailState("ready");
  }, [
    invalidateFormLoads,
    isNewRoute,
    routeKey,
    replaceWithNewForm,
    resetThumbnail,
  ]);

  useEffect(() => {
    if (detailParam === null) return;
    if (formMatchesCurrentRoute(detailParam)) {
      setGlobalError(undefined);
      setContentSchemaError(undefined);
      setDetailState("ready");
      return;
    }

    const controller = new AbortController();
    const load = beginFormLoad(detailParam);
    setDetailState("loading");
    setGlobalError(undefined);
    setCleanupWarning(undefined);
    setContentSchemaError(undefined);
    setFieldErrors({});

    void (async () => {
      let result: Awaited<ReturnType<typeof getBlogPostBySlug>>;
      try {
        result = await getBlogPostBySlug(supabaseConfig, detailParam, {
          signal: controller.signal,
        });
      } catch {
        if (controller.signal.aborted || !formLoadIsCurrent(load)) return;
        setGlobalError(adminFailureMessage(networkFailure()));
        setDetailState("ready");
        return;
      }
      if (controller.signal.aborted || !formLoadIsCurrent(load)) return;
      if (!result.ok) {
        setGlobalError(adminFailureMessage(result.error));
        setDetailState("ready");
        return;
      }
      if (!result.value) {
        setGlobalError("요청한 Blog 글을 찾을 수 없습니다.");
        setDetailState("ready");
        return;
      }

      let loadedForm: BlogFormState;
      try {
        loadedForm = blogFormFromRow(result.value);
      } catch (error) {
        if (error instanceof ManagedContentSchemaError) {
          setContentSchemaError(error.message);
          setGlobalError(error.message);
          setDetailState("ready");
          return;
        }
        throw error;
      }

      if (!acceptLoadedForm(load, result.value, loadedForm)) {
        if (formMatchesCurrentRoute(detailParam)) setDetailState("ready");
        return;
      }
      setEditingPost(result.value);
      resetThumbnail(result.value.thumbnail_public_url);
      setDetailState("ready");
    })();

    return () => controller.abort();
  }, [
    acceptLoadedForm,
    beginFormLoad,
    formLoadIsCurrent,
    formMatchesCurrentRoute,
    detailParam,
    resetThumbnail,
  ]);

  const updateForm = <Key extends keyof BlogFormState>(
    key: Key,
    value: BlogFormState[Key],
  ) => {
    formOwner.updateForDocument(formOwner.documentKey, (current) => ({
      ...current,
      [key]: value,
    }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleContentChange = (
    contentValue: Pick<
      BlogFormState,
      | "content"
      | "contentAssetBaseEnabled"
      | "contentAssetScope"
      | "contentAuthoringMode"
      | "contentJson"
      | "contentMode"
      | "contentSchemaVersion"
      | "contentSourceBackup"
    >,
  ) => {
    formOwner.updateForDocument(formOwner.documentKey, (current) => ({
      ...current,
      ...contentValue,
    }));
    setFieldErrors((current) => ({ ...current, content: undefined }));
  };

  const handleThumbnailChange = (fileList: FileList | null) => {
    if (!formOwner.documentIsCurrent(formOwner.documentKey)) return;
    const result = thumbnail.select(fileList);
    if (!result.ok) {
      setFieldErrors((current) => ({
        ...current,
        thumbnail: result.message,
      }));
      return;
    }
    setFieldErrors((current) => ({ ...current, thumbnail: undefined }));
  };

  const handleThumbnailRemove = () => {
    if (!formOwner.documentIsCurrent(formOwner.documentKey)) return;
    thumbnail.remove();
  };

  const hardDisabled =
    isDeleting ||
    isSaving ||
    detailState === "loading" ||
    contentSchemaError !== undefined ||
    (!isNewRoute && !hasCurrentEditingPost);
  const actionBlockReason = managedContentActionBlockReason({
    editorBusy: editorState.busy,
    pendingAssetCount: editorState.pendingAssetCount,
  });
  const actionDisabled = hardDisabled || actionBlockReason !== undefined;

  const savePost = async (status: BlogPostStatus) => {
    if (actionDisabled) return;

    const nextForm = blogFormWithStatus(formOwner.form, status);
    const parsed = validateBlogForm(nextForm);
    setFieldErrors(parsed.ok ? {} : parsed.fields);
    if (!parsed.ok) {
      setGlobalError(parsed.message);
      requestFailureNavigation();
      return;
    }

    const imageIssue = validateManagedContentImagesForPublish(
      supabaseConfig,
      "blog",
      parsed.value,
    );
    if (imageIssue) {
      setFieldErrors((current) => ({ ...current, content: imageIssue }));
      setGlobalError("본문 이미지를 확인해 주세요.");
      requestFailureNavigation();
      return;
    }

    const existingPost = editingPost;
    if (!isNewRoute && !existingPost) {
      setGlobalError("저장할 Blog 글을 먼저 불러와야 합니다.");
      requestFailureNavigation();
      return;
    }

    const owner = formOwner.captureOwner();
    if (!formOwner.lockOwner(owner)) return;
    mutationControllerRef.current?.abort();
    const operationController = new AbortController();
    mutationControllerRef.current = operationController;
    const operation = operationGeneration.begin(routeKey);
    const releaseOperation = () => {
      if (mutationControllerRef.current === operationController) {
        mutationControllerRef.current = null;
      }
    };

    setIsDeleting(false);
    setIsSaving(true);
    setGlobalError(undefined);
    setCleanupWarning(undefined);

    const outcome = await persistThumbnailChange({
      config: supabaseConfig,
      current: {
        path: existingPost?.thumbnail_path ?? null,
        publicUrl: existingPost?.thumbnail_public_url ?? null,
      },
      removed: thumbnail.selection.removed,
      save: async (nextThumbnail) => {
        if (
          operationController.signal.aborted ||
          !operationIsCurrent(operation) ||
          !formOwner.ownerIsCurrent(owner)
        ) {
          return adminErr(saveFailure());
        }

        const input: BlogPostCreateInput = {
          ...parsed.value,
          bannerPath: existingPost?.banner_path ?? null,
          bannerPublicUrl: existingPost?.banner_public_url ?? null,
          thumbnailPath: nextThumbnail.path,
          thumbnailPublicUrl: nextThumbnail.publicUrl,
        };
        return existingPost
          ? updateBlogPost(supabaseConfig, existingPost.id, input, {
              signal: operationController.signal,
            })
          : createBlogPost(supabaseConfig, input, {
              signal: operationController.signal,
            });
      },
      selected: thumbnail.selection.selected,
      slug: parsed.value.slug,
    });

    if (!operationIsCurrent(operation) || !formOwner.ownerIsCurrent(owner)) {
      return;
    }

    const warning = thumbnailCleanupWarning(outcome.cleanupIssues);
    setCleanupWarning(warning);
    if (!outcome.result.ok) {
      formOwner.unlockOwner(owner);
      releaseOperation();
      const nextError = blogFailureToErrors(outcome.result.error);
      setFieldErrors((current) => ({ ...current, ...nextError.fields }));
      setGlobalError(nextError.message);
      setIsSaving(false);
      requestFailureNavigation();
      return;
    }

    let savedForm: BlogFormState;
    try {
      savedForm = blogFormFromRow(outcome.result.value);
    } catch (error) {
      if (error instanceof ManagedContentSchemaError) {
        formOwner.unlockOwner(owner);
        releaseOperation();
        setContentSchemaError(error.message);
        setGlobalError(error.message);
        setIsSaving(false);
        requestFailureNavigation();
        return;
      }
      throw error;
    }

    if (!formOwner.acceptSaved(owner, outcome.result.value, savedForm)) return;
    if (
      existingPost?.status === "published" ||
      outcome.result.value.status === "published"
    ) {
      const revalidation = await revalidatePublicContent(supabaseConfig, {
        entity: "blog",
        previousSlug: existingPost?.slug,
        slug: outcome.result.value.slug,
      });
      if (!revalidation.ok) {
        console.error(revalidation.message);
      }
    }
    releaseOperation();
    setEditingPost(outcome.result.value);
    thumbnail.reset(outcome.result.value.thumbnail_public_url);
    setFieldErrors({});
    setIsSaving(false);
    onNavigate("/blog");
  };

  const deletePost = async () => {
    if (
      actionDisabled ||
      !hasCurrentEditingPost ||
      !editingPost ||
      !window.confirm("이 Blog 글을 삭제할까요?")
    ) {
      return;
    }

    const owner = formOwner.captureOwner();
    if (!formOwner.lockOwner(owner)) return;
    mutationControllerRef.current?.abort();
    const operationController = new AbortController();
    mutationControllerRef.current = operationController;
    const operation = operationGeneration.begin(routeKey);
    const releaseOperation = () => {
      if (mutationControllerRef.current === operationController) {
        mutationControllerRef.current = null;
      }
    };

    setIsSaving(false);
    setIsDeleting(true);
    setGlobalError(undefined);
    setCleanupWarning(undefined);
    const outcome = await deleteBlogPostWithStorageCleanup(
      supabaseConfig,
      editingPost.id,
      {
        signal: operationController.signal,
      },
    );
    if (!operationIsCurrent(operation) || !formOwner.ownerIsCurrent(owner)) {
      return;
    }
    if (!outcome.result.ok) {
      formOwner.unlockOwner(owner);
      releaseOperation();
      setGlobalError(adminFailureMessage(outcome.result.error));
      setIsDeleting(false);
      return;
    }
    if (editingPost.status === "published") {
      const revalidation = await revalidatePublicContent(supabaseConfig, {
        entity: "blog",
        previousSlug: editingPost.slug,
      });
      if (!revalidation.ok) {
        console.error(revalidation.message);
      }
    }
    formOwner.unlockOwner(owner);
    releaseOperation();
    setIsDeleting(false);
    setCleanupWarning(thumbnailCleanupWarning(outcome.cleanupIssues));
    onNavigate("/blog");
  };

  return (
    <section
      aria-labelledby="blog-form-title"
      className={styles.blogFormSection}
      ref={formRef}
    >
      <div
        aria-busy={isSaving || isDeleting || detailState === "loading"}
        className={styles.blogFormPanel}
      >
        <div className={styles.blogFormLayout}>
          <div className={styles.blogFormBody}>
            <h1 className={styles.blogFormTitle} id="blog-form-title">
              {isNewRoute ? "신규 블로그 등록" : "블로그 수정"}
            </h1>
            {globalError ? (
              <BlogMessage message={globalError} tone="error" />
            ) : null}
            {cleanupWarning ? (
              <p className={styles.cleanupWarning} role="status">
                {cleanupWarning}
              </p>
            ) : null}
            {detailState === "loading" ? (
              <BlogMessage
                message="Blog 글을 불러오는 중입니다."
                tone="success"
              />
            ) : null}
            <BlogFormFields
              contentPreviewContainer={contentPreviewContainer}
              documentKey={formOwner.documentKey}
              fieldErrors={fieldErrors}
              form={formOwner.form}
              isDisabled={hardDisabled}
              onContentBusyChange={editorState.onBusyChange}
              onContentChange={handleContentChange}
              onFieldChange={updateForm}
              onPendingAssetCountChange={editorState.onPendingAssetCountChange}
              onThumbnailChange={handleThumbnailChange}
              onThumbnailRemove={handleThumbnailRemove}
              thumbnail={thumbnail.selection}
            />
          </div>
          <aside
            aria-label="블로그 본문 미리보기"
            className={styles.blogPreviewColumn}
          >
            <div
              className={styles.blogPreviewMount}
              ref={setContentPreviewContainerRef}
            />
          </aside>
        </div>
        <div className={styles.blogActionArea}>
          {actionBlockReason ? (
            <p className={styles.actionBlockReason} role="status">
              {actionBlockReason}
            </p>
          ) : null}
          <div className={styles.blogFormActions}>
            <AdminButton
              className={`${styles.formActionButton} ${styles.blogFormSecondaryAction}`}
              disabled={actionDisabled}
              onClick={() => onNavigate("/blog")}
              size="figma"
              variant="secondary"
            >
              목록으로
            </AdminButton>
            <div className={styles.blogFormActionGroup}>
              {!isNewRoute ? (
                <AdminButton
                  className={`${styles.formActionButton} ${styles.deleteActionButton}`}
                  disabled={actionDisabled || !hasCurrentEditingPost}
                  icon={<AdminTrashIcon size={16} />}
                  onClick={deletePost}
                  size="figma"
                  variant="danger"
                >
                  {isDeleting ? "삭제 중" : "삭제"}
                </AdminButton>
              ) : null}
              <AdminButton
                className={`${styles.formActionButton} ${styles.blogFormSecondaryAction}`}
                disabled={actionDisabled}
                onClick={() => savePost("draft")}
                size="figma"
                variant="secondary"
              >
                임시저장
              </AdminButton>
              <AdminButton
                className={`${styles.formActionButton} ${styles.submitActionButton}`}
                disabled={actionDisabled}
                icon={<AdminArrowRightIcon size={16} />}
                iconPosition="right"
                onClick={() => savePost("published")}
                size="figma"
              >
                {isSaving ? "저장 중" : isNewRoute ? "등록하기" : "수정하기"}
              </AdminButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
