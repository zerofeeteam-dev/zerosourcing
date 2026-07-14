import { useEffect, useRef, useState } from "react";
import {
  AdminArrowRightIcon,
  AdminButton,
  AdminFormActions,
  AdminFormPage,
  AdminTrashIcon,
} from "../../components/admin";
import { adminFailureMessage } from "../../lib/adminErrors";
import type { BlogPostCreateInput, BlogPostRow, BlogPostStatus } from "../../lib/adminRepositoryTypes";
import { ManagedContentSchemaError } from "../../lib/managedContent";
import { adminFailureProvesRowWriteRejected } from "../../lib/adminWriteOutcome";
import {
  createOperationGeneration,
  type OperationGeneration,
  type OperationToken,
} from "../../lib/operationGeneration";
import type { AdminThumbnailFile } from "../../lib/adminTypes";
import { parseAdminThumbnailFile } from "../../lib/adminValidation";
import { createBlogPost, deleteBlogPost, getBlogPostBySlug, updateBlogPost } from "../../lib/blogRepository";
import { supabaseConfig } from "../../lib/supabase";
import { removeBlogThumbnail, uploadBlogThumbnail } from "../../lib/thumbnailStorage";
import { BlogFormFields } from "./BlogFormFields";
import { BlogMessage } from "./BlogMessage";
import {
  blogFailureToErrors,
  blogFormFromRow,
  blogFormWithStatus,
  createEmptyBlogFormState,
  validateBlogForm,
} from "./blogModel";
import type { BlogFieldErrors, BlogFormRoute, BlogFormState } from "./blogTypes";
import styles from "../BlogAdminPage.module.css";

type BlogFormPageProps = {
  readonly onNavigate: (path: string) => void;
  readonly route: BlogFormRoute;
};

export function BlogFormPage({ onNavigate, route }: BlogFormPageProps) {
  const isNewRoute = route.id === "blogNew";
  const [detailState, setDetailState] = useState<"idle" | "loading" | "ready">("idle");
  const [form, setForm] = useState<BlogFormState>(() =>
    createEmptyBlogFormState(),
  );
  const [editingPost, setEditingPost] = useState<BlogPostRow | null>(null);
  const [editingRouteParam, setEditingRouteParam] = useState<string>();
  const [selectedThumbnail, setSelectedThumbnail] = useState<AdminThumbnailFile>();
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>();
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<BlogFieldErrors>({});
  const [globalError, setGlobalError] = useState<string>();
  const [contentSchemaError, setContentSchemaError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const previousRouteId = useRef(route.id);
  const mutationControllerRef = useRef<AbortController | null>(null);
  const operationGenerationRef = useRef<OperationGeneration | null>(null);
  if (operationGenerationRef.current === null) {
    operationGenerationRef.current = createOperationGeneration();
  }
  const operationGeneration = operationGenerationRef.current;
  const routeKey =
    route.id === "blogDetail" ? `blog:detail:${route.param}` : "blog:new";
  const currentRouteKeyRef = useRef(routeKey);
  currentRouteKeyRef.current = routeKey;
  const operationIsCurrent = (operation: OperationToken) =>
    operationGeneration.isCurrent(operation, currentRouteKeyRef.current);
  const hasCurrentEditingPost =
    route.id === "blogDetail" &&
    editingPost !== null &&
    editingRouteParam === route.param;

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
    if (!isNewRoute) return;
    const previousId = previousRouteId.current;
    previousRouteId.current = route.id;
    if (previousId !== "blogNew") setForm(createEmptyBlogFormState());
    setEditingPost(null);
    setEditingRouteParam(undefined);
    setSelectedThumbnail(undefined);
    setThumbnailPreviewUrl(undefined);
    setThumbnailRemoved(false);
    setFieldErrors({});
    setGlobalError(undefined);
    setContentSchemaError(undefined);
    setSuccessMessage(undefined);
    setDetailState("ready");
  }, [isNewRoute, route.id]);

  useEffect(() => {
    if (route.id !== "blogDetail") return;
    previousRouteId.current = route.id;
    let isActive = true;
    setDetailState("loading");
    setEditingPost(null);
    setEditingRouteParam(undefined);
    setSelectedThumbnail(undefined);
    setThumbnailPreviewUrl(undefined);
    setThumbnailRemoved(false);
    setGlobalError(undefined);
    setContentSchemaError(undefined);
    setFieldErrors({});
    setSuccessMessage(undefined);

    void getBlogPostBySlug(supabaseConfig, route.param).then((result) => {
      if (!isActive) return;
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
      try {
        setForm(blogFormFromRow(result.value));
      } catch (error) {
        if (error instanceof ManagedContentSchemaError) {
          setContentSchemaError(error.message);
          setGlobalError(error.message);
          setDetailState("ready");
          return;
        }
        throw error;
      }
      setEditingPost(result.value);
      setEditingRouteParam(route.param);
      setThumbnailPreviewUrl(result.value.thumbnail_public_url ?? undefined);
      setSelectedThumbnail(undefined);
      setThumbnailRemoved(false);
      setDetailState("ready");
    });

    return () => {
      isActive = false;
    };
  }, [route]);

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [thumbnailPreviewUrl]);

  const updateForm = <Key extends keyof BlogFormState>(key: Key, value: BlogFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleThumbnailChange = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const result = parseAdminThumbnailFile(file, "thumbnail");
    if (!result.ok) {
      setFieldErrors((current) => ({ ...current, thumbnail: result.error.message }));
      setSelectedThumbnail(undefined);
      return;
    }
    setSelectedThumbnail(result.value);
    setThumbnailRemoved(false);
    setFieldErrors((current) => ({ ...current, thumbnail: undefined }));
    setThumbnailPreviewUrl(URL.createObjectURL(file));
  };

  const removeVisibleThumbnail = () => {
    setSelectedThumbnail(undefined);
    setThumbnailPreviewUrl(undefined);
    setThumbnailRemoved(true);
  };

  const savePost = async (status: BlogPostStatus) => {
    if (
      isSaving ||
      detailState === "loading" ||
      contentSchemaError ||
      (!isNewRoute && !hasCurrentEditingPost)
    ) {
      return;
    }
    const nextForm = blogFormWithStatus(form, status);
    const parsed = validateBlogForm(nextForm);
    setFieldErrors(parsed.ok ? {} : parsed.fields);
    if (!parsed.ok) {
      setGlobalError(parsed.message);
      return;
    }

    const existingPost = editingPost;
    if (!isNewRoute && !existingPost) {
      setGlobalError("저장할 Blog 글을 먼저 불러와야 합니다.");
      return;
    }

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
    setSuccessMessage(undefined);

    let nextThumbnailPath = thumbnailRemoved ? null : editingPost?.thumbnail_path ?? null;
    let nextThumbnailUrl = thumbnailRemoved ? null : editingPost?.thumbnail_public_url ?? null;
    let uploadedPath: string | undefined;

    if (selectedThumbnail) {
      const uploadResult = await uploadBlogThumbnail(supabaseConfig, {
        slug: parsed.value.slug,
        thumbnail: selectedThumbnail,
      });
      if (!operationIsCurrent(operation)) {
        if (uploadResult.ok) {
          await removeBlogThumbnail(supabaseConfig, uploadResult.value.path);
        }
        return;
      }
      if (!uploadResult.ok) {
        releaseOperation();
        setGlobalError(adminFailureMessage(uploadResult.error));
        setIsSaving(false);
        return;
      }
      uploadedPath = uploadResult.value.path;
      nextThumbnailPath = uploadResult.value.path;
      nextThumbnailUrl = uploadResult.value.publicUrl;
    }

    const input: BlogPostCreateInput = {
      ...parsed.value,
      thumbnailPath: nextThumbnailPath,
      thumbnailPublicUrl: nextThumbnailUrl,
    };
    let saveResult: Awaited<ReturnType<typeof createBlogPost>>;
    if (isNewRoute) {
      saveResult = await createBlogPost(supabaseConfig, input, {
        signal: operationController.signal,
      });
    } else {
      if (!existingPost) {
        if (uploadedPath) {
          await removeBlogThumbnail(supabaseConfig, uploadedPath);
          if (!operationIsCurrent(operation)) return;
        }
        releaseOperation();
        setGlobalError("저장할 Blog 글을 먼저 불러와야 합니다.");
        setIsSaving(false);
        return;
      }
      saveResult = await updateBlogPost(supabaseConfig, existingPost.id, input, {
        signal: operationController.signal,
      });
    }

    if (!operationIsCurrent(operation)) {
      if (
        !saveResult.ok &&
        uploadedPath &&
        adminFailureProvesRowWriteRejected(saveResult.error)
      ) {
        await removeBlogThumbnail(supabaseConfig, uploadedPath);
      }
      return;
    }

    if (!saveResult.ok) {
      if (
        uploadedPath &&
        adminFailureProvesRowWriteRejected(saveResult.error)
      ) {
        await removeBlogThumbnail(supabaseConfig, uploadedPath);
        if (!operationIsCurrent(operation)) return;
      }
      releaseOperation();
      const nextError = blogFailureToErrors(saveResult.error);
      setFieldErrors((current) => ({ ...current, ...nextError.fields }));
      setGlobalError(nextError.message);
      setIsSaving(false);
      return;
    }

    const oldThumbnailPath = existingPost?.thumbnail_path;
    if (oldThumbnailPath && (thumbnailRemoved || selectedThumbnail)) {
      const cleanupResult = await removeBlogThumbnail(supabaseConfig, oldThumbnailPath);
      if (!operationIsCurrent(operation)) return;
      if (!cleanupResult.ok) setGlobalError(adminFailureMessage(cleanupResult.error));
    }

    let savedForm: BlogFormState;
    try {
      savedForm = blogFormFromRow(saveResult.value);
    } catch (error) {
      if (error instanceof ManagedContentSchemaError) {
        releaseOperation();
        setContentSchemaError(error.message);
        setGlobalError(error.message);
        setIsSaving(false);
        return;
      }
      throw error;
    }

    if (!operationIsCurrent(operation)) return;
    releaseOperation();
    setForm(savedForm);
    setEditingPost(saveResult.value);
    setEditingRouteParam(saveResult.value.slug);
    setSelectedThumbnail(undefined);
    setThumbnailRemoved(false);
    setThumbnailPreviewUrl(saveResult.value.thumbnail_public_url ?? undefined);
    setSuccessMessage(existingPost === null ? "Blog 글을 등록했습니다." : "Blog 글을 저장했습니다.");
    setIsSaving(false);

    if (
      route.id !== "blogDetail" ||
      route.param !== saveResult.value.slug
    ) {
      if (!operationIsCurrent(operation)) return;
      onNavigate(`/blog/${saveResult.value.slug}`);
    }
  };

  const deletePost = async () => {
    if (
      !hasCurrentEditingPost ||
      !editingPost ||
      isDeleting ||
      isSaving ||
      detailState === "loading" ||
      contentSchemaError
    ) {
      return;
    }
    if (!window.confirm("이 Blog 글을 삭제할까요?")) return;
    mutationControllerRef.current?.abort();
    const operationController = new AbortController();
    mutationControllerRef.current = operationController;
    const operation = operationGeneration.begin(routeKey);
    if (!operationIsCurrent(operation)) return;
    const releaseOperation = () => {
      if (mutationControllerRef.current === operationController) {
        mutationControllerRef.current = null;
      }
    };

    setIsSaving(false);
    setIsDeleting(true);
    setGlobalError(undefined);
    const result = await deleteBlogPost(supabaseConfig, editingPost.id, {
      signal: operationController.signal,
    });
    if (!operationIsCurrent(operation)) return;
    if (!result.ok) {
      releaseOperation();
      setGlobalError(adminFailureMessage(result.error));
      setIsDeleting(false);
      return;
    }
    if (result.value.thumbnail_path) {
      await removeBlogThumbnail(supabaseConfig, result.value.thumbnail_path);
      if (!operationIsCurrent(operation)) return;
    }
    releaseOperation();
    setIsDeleting(false);
    if (!operationIsCurrent(operation)) return;
    onNavigate("/blog");
  };

  return (
    <AdminFormPage
      actions={
        <AdminFormActions
          leading={
            <>
              <AdminButton
                className={styles.formActionButton}
                disabled={isDeleting || isSaving}
                onClick={() => onNavigate("/blog")}
                size="figma"
                variant="secondary"
              >
                목록으로
              </AdminButton>
              {!isNewRoute ? (
                <AdminButton
                  className={`${styles.formActionButton} ${styles.deleteActionButton}`}
                  disabled={
                    isDeleting ||
                    isSaving ||
                    detailState === "loading" ||
                    contentSchemaError !== undefined ||
                    !hasCurrentEditingPost
                  }
                  icon={<AdminTrashIcon size={16} />}
                  onClick={deletePost}
                  size="figma"
                  variant="danger"
                >
                  {isDeleting ? "삭제 중" : "삭제"}
                </AdminButton>
              ) : null}
            </>
          }
          trailing={
            <>
              <AdminButton
                className={styles.formActionButton}
                disabled={
                  isDeleting ||
                  isSaving ||
                  detailState === "loading" ||
                  contentSchemaError !== undefined ||
                  (!isNewRoute && !hasCurrentEditingPost)
                }
                onClick={() => savePost("draft")}
                size="figma"
                variant="secondary"
              >
                임시저장
              </AdminButton>
              <AdminButton
                className={`${styles.formActionButton} ${styles.submitActionButton}`}
                disabled={
                  isDeleting ||
                  isSaving ||
                  detailState === "loading" ||
                  contentSchemaError !== undefined ||
                  (!isNewRoute && !hasCurrentEditingPost)
                }
                icon={<AdminArrowRightIcon size={16} />}
                iconPosition="right"
                onClick={() => savePost("published")}
                size="figma"
              >
                {isSaving ? "저장 중" : isNewRoute ? "등록하기" : "수정하기"}
              </AdminButton>
            </>
          }
        />
      }
      busy={isSaving || isDeleting || detailState === "loading"}
      title={isNewRoute ? "신규 블로그 등록" : "블로그 수정"}
    >
      {globalError ? <BlogMessage message={globalError} tone="error" /> : null}
      {successMessage ? <BlogMessage message={successMessage} tone="success" /> : null}
      {detailState === "loading" ? <BlogMessage message="Blog 글을 불러오는 중입니다." tone="success" /> : null}
      <BlogFormFields
        fieldErrors={fieldErrors}
        form={form}
        isDisabled={
          isSaving ||
          isDeleting ||
          detailState === "loading" ||
          contentSchemaError !== undefined ||
          (!isNewRoute && !hasCurrentEditingPost)
        }
        onFieldChange={updateForm}
        onThumbnailChange={handleThumbnailChange}
        onThumbnailRemove={removeVisibleThumbnail}
        thumbnail={{ previewUrl: thumbnailPreviewUrl, removed: thumbnailRemoved, selected: selectedThumbnail }}
      />
    </AdminFormPage>
  );
}
