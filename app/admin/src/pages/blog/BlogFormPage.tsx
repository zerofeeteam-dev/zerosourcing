import { useEffect, useState } from "react";
import {
  AdminArrowRightIcon,
  AdminButton,
  AdminFormActions,
  AdminFormPage,
  AdminTrashIcon,
} from "../../components/admin";
import { adminFailureMessage } from "../../lib/adminErrors";
import type { BlogPostCreateInput, BlogPostRow, BlogPostStatus } from "../../lib/adminRepositoryTypes";
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
  emptyBlogForm,
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
  const [form, setForm] = useState<BlogFormState>(emptyBlogForm);
  const [editingPost, setEditingPost] = useState<BlogPostRow | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<AdminThumbnailFile>();
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>();
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<BlogFieldErrors>({});
  const [globalError, setGlobalError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isNewRoute) return;
    setForm(emptyBlogForm);
    setEditingPost(null);
    setSelectedThumbnail(undefined);
    setThumbnailPreviewUrl(undefined);
    setThumbnailRemoved(false);
    setFieldErrors({});
    setGlobalError(undefined);
    setSuccessMessage(undefined);
    setDetailState("ready");
  }, [isNewRoute]);

  useEffect(() => {
    if (route.id !== "blogDetail") return;
    let isActive = true;
    setDetailState("loading");
    setGlobalError(undefined);
    setFieldErrors({});

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
      setEditingPost(result.value);
      setForm(blogFormFromRow(result.value));
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
    if (isSaving) return;
    const nextForm = blogFormWithStatus(form, status);
    const parsed = validateBlogForm(nextForm);
    setFieldErrors(parsed.ok ? {} : parsed.fields);
    if (!parsed.ok) {
      setGlobalError(parsed.message);
      return;
    }

    setIsSaving(true);
    setGlobalError(undefined);
    setSuccessMessage(undefined);

    const existingPost = editingPost;

    let nextThumbnailPath = thumbnailRemoved ? null : editingPost?.thumbnail_path ?? null;
    let nextThumbnailUrl = thumbnailRemoved ? null : editingPost?.thumbnail_public_url ?? null;
    let uploadedPath: string | undefined;

    if (selectedThumbnail) {
      const uploadResult = await uploadBlogThumbnail(supabaseConfig, {
        slug: parsed.value.slug,
        thumbnail: selectedThumbnail,
      });
      if (!uploadResult.ok) {
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
      saveResult = await createBlogPost(supabaseConfig, input);
    } else {
      if (!existingPost) {
        setGlobalError("저장할 Blog 글을 먼저 불러와야 합니다.");
        setIsSaving(false);
        return;
      }
      saveResult = await updateBlogPost(supabaseConfig, existingPost.id, input);
    }

    if (!saveResult.ok) {
      if (uploadedPath) await removeBlogThumbnail(supabaseConfig, uploadedPath);
      const nextError = blogFailureToErrors(saveResult.error);
      setFieldErrors((current) => ({ ...current, ...nextError.fields }));
      setGlobalError(nextError.message);
      setIsSaving(false);
      return;
    }

    const oldThumbnailPath = editingPost?.thumbnail_path;
    if (oldThumbnailPath && (thumbnailRemoved || selectedThumbnail)) {
      const cleanupResult = await removeBlogThumbnail(supabaseConfig, oldThumbnailPath);
      if (!cleanupResult.ok) setGlobalError(adminFailureMessage(cleanupResult.error));
    }

    setEditingPost(saveResult.value);
    setForm(blogFormFromRow(saveResult.value));
    setSelectedThumbnail(undefined);
    setThumbnailRemoved(false);
    setThumbnailPreviewUrl(saveResult.value.thumbnail_public_url ?? undefined);
    setSuccessMessage(editingPost === null ? "Blog 글을 등록했습니다." : "Blog 글을 저장했습니다.");
    setIsSaving(false);

    if (editingPost === null) onNavigate(`/blog/${saveResult.value.slug}`);
  };

  const deletePost = async () => {
    if (!editingPost || isDeleting) return;
    if (!window.confirm("이 Blog 글을 삭제할까요?")) return;
    setIsDeleting(true);
    setGlobalError(undefined);
    const result = await deleteBlogPost(supabaseConfig, editingPost.id);
    if (!result.ok) {
      setGlobalError(adminFailureMessage(result.error));
      setIsDeleting(false);
      return;
    }
    if (result.value.thumbnail_path) await removeBlogThumbnail(supabaseConfig, result.value.thumbnail_path);
    setIsDeleting(false);
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
                  disabled={isDeleting || isSaving || !editingPost}
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
                disabled={isDeleting || isSaving || detailState === "loading"}
                onClick={() => savePost("draft")}
                size="figma"
                variant="secondary"
              >
                임시저장
              </AdminButton>
              <AdminButton
                className={`${styles.formActionButton} ${styles.submitActionButton}`}
                disabled={isDeleting || isSaving || detailState === "loading"}
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
        isDisabled={isSaving || isDeleting || detailState === "loading"}
        onFieldChange={updateForm}
        onThumbnailChange={handleThumbnailChange}
        onThumbnailRemove={removeVisibleThumbnail}
        thumbnail={{ previewUrl: thumbnailPreviewUrl, removed: thumbnailRemoved, selected: selectedThumbnail }}
      />
    </AdminFormPage>
  );
}
