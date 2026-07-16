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
  PortfolioCreateInput,
  PortfolioRow,
  PortfolioStatus,
} from "../../lib/adminRepositoryTypes";
import { adminErr } from "../../lib/adminTypes";
import { validateAdminImageDimensions } from "../../lib/adminValidation";
import { ManagedContentSchemaError } from "../../lib/managedContent";
import {
  createOperationGeneration,
  type OperationGeneration,
  type OperationToken,
} from "../../lib/operationGeneration";
import {
  createPortfolio,
  getPortfolioBySlug,
  updatePortfolio,
} from "../../lib/portfolioRepository";
import { deletePortfolioWithStorageCleanup } from "../../lib/portfolioDeletion";
import { supabaseConfig } from "../../lib/supabase";
import { persistThumbnailChange } from "../../lib/thumbnailPersistence";
import { usePendingAssetRegistration } from "../../navigation/PendingAssetNavigation";
import {
  managedContentActionBlockReason,
  thumbnailCleanupWarning,
} from "../content/managedContentFormFeedback";
import { validateManagedContentImagesForPublish } from "../content/managedContentPublishValidation";
import { useAdminThumbnailSelection } from "../content/useAdminThumbnailSelection";
import { useManagedContentEditorState } from "../content/useManagedContentEditorState";
import { useManagedContentFormState } from "../content/useManagedContentFormState";
import {
  buildPortfolioInput,
  createEmptyPortfolioFormState,
  portfolioFormFromRow,
} from "./portfolioModel";
import type {
  PortfolioFormErrors,
  PortfolioFormRoute,
  PortfolioFormState,
} from "./portfolioTypes";
import { PortfolioFormFields } from "./PortfolioFormFields";
import styles from "../PortfolioAdminPage.module.css";

type PortfolioFormPageProps = {
  readonly onNavigate: (path: string) => void;
  readonly route: PortfolioFormRoute;
};

export function PortfolioFormPage({
  onNavigate,
  route,
}: PortfolioFormPageProps) {
  const isEditMode = route.id === "portfolioDetail";
  const detailParam = route.id === "portfolioDetail" ? route.param : null;
  const routeKey = detailParam
    ? `portfolio:detail:${detailParam}`
    : "portfolio:new";
  const formOwner = useManagedContentFormState<PortfolioFormState>({
    createEmptyForm: createEmptyPortfolioFormState,
    entity: "portfolio",
  });
  const editorState = useManagedContentEditorState(
    formOwner.documentKey,
    formOwner.documentIsCurrent,
  );
  const thumbnail = useAdminThumbnailSelection();
  const banner = useAdminThumbnailSelection();
  const acceptLoadedForm = formOwner.acceptLoaded;
  const beginFormLoad = formOwner.beginLoad;
  const invalidateFormLoads = formOwner.invalidateLoads;
  const formLoadIsCurrent = formOwner.loadIsCurrent;
  const formMatchesCurrentRoute = formOwner.matchesCurrentRoute;
  const replaceWithNewForm = formOwner.replaceWithNew;
  const resetThumbnail = thumbnail.reset;
  const resetBanner = banner.reset;

  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioRow | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isPending, setIsPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PortfolioFormErrors>({});
  const [globalError, setGlobalError] = useState<string>();
  const [cleanupWarning, setCleanupWarning] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [contentSchemaError, setContentSchemaError] = useState<string>();
  const [contentPreviewContainer, setContentPreviewContainer] =
    useState<HTMLDivElement | null>(null);

  usePendingAssetRegistration(editorState.pendingAssetCount);

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

  const hasCurrentEditingPortfolio =
    route.id === "portfolioDetail" &&
    editingPortfolio !== null &&
    editingPortfolio.id === formOwner.recordId &&
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
    setIsPending(false);

    return () => {
      mutationControllerRef.current?.abort();
      mutationControllerRef.current = null;
      operationGeneration.invalidate();
    };
  }, [operationGeneration, routeKey]);

  useEffect(() => {
    const routeChanged = previousRouteKeyRef.current !== routeKey;
    previousRouteKeyRef.current = routeKey;
    if (isEditMode) return;

    invalidateFormLoads();
    if (routeChanged) replaceWithNewForm();
    setEditingPortfolio(null);
    resetThumbnail();
    resetBanner();
    setFieldErrors({});
    setGlobalError(undefined);
    setCleanupWarning(undefined);
    setSuccessMessage(undefined);
    setContentSchemaError(undefined);
    setIsLoading(false);
  }, [
    invalidateFormLoads,
    isEditMode,
    routeKey,
    replaceWithNewForm,
    resetThumbnail,
    resetBanner,
  ]);

  useEffect(() => {
    if (detailParam === null) return;
    if (formMatchesCurrentRoute(detailParam)) {
      setGlobalError(undefined);
      setContentSchemaError(undefined);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const load = beginFormLoad(detailParam);
    setIsLoading(true);
    setFieldErrors({});
    setGlobalError(undefined);
    setCleanupWarning(undefined);
    setSuccessMessage(undefined);
    setContentSchemaError(undefined);

    void (async () => {
      let result: Awaited<ReturnType<typeof getPortfolioBySlug>>;
      try {
        result = await getPortfolioBySlug(supabaseConfig, detailParam, {
          signal: controller.signal,
        });
      } catch {
        if (controller.signal.aborted || !formLoadIsCurrent(load)) return;
        setIsLoading(false);
        setGlobalError(adminFailureMessage(networkFailure()));
        return;
      }
      if (controller.signal.aborted || !formLoadIsCurrent(load)) return;
      setIsLoading(false);
      if (!result.ok) {
        setGlobalError(adminFailureMessage(result.error));
        return;
      }
      if (!result.value) {
        setGlobalError("해당 slug의 Portfolio를 찾을 수 없습니다.");
        return;
      }

      let loadedForm: PortfolioFormState;
      try {
        loadedForm = portfolioFormFromRow(result.value);
      } catch (error) {
        if (error instanceof ManagedContentSchemaError) {
          setContentSchemaError(error.message);
          setGlobalError(error.message);
          return;
        }
        throw error;
      }

      if (!acceptLoadedForm(load, result.value, loadedForm)) return;
      setEditingPortfolio(result.value);
      resetThumbnail(result.value.thumbnail_public_url);
      resetBanner(result.value.banner_public_url);
    })();

    return () => controller.abort();
  }, [
    acceptLoadedForm,
    beginFormLoad,
    formLoadIsCurrent,
    formMatchesCurrentRoute,
    detailParam,
    resetThumbnail,
    resetBanner,
  ]);

  const handleFormChange = (nextForm: PortfolioFormState) => {
    formOwner.updateForDocument(formOwner.documentKey, nextForm);
  };

  const handleContentChange = (
    contentValue: Pick<
      PortfolioFormState,
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

  const handleBannerChange = (fileList: FileList | null) => {
    if (!formOwner.documentIsCurrent(formOwner.documentKey)) return;
    const result = banner.select(fileList);
    if (!result.ok) {
      setFieldErrors((current) => ({ ...current, banner: result.message }));
      return;
    }
    setFieldErrors((current) => ({ ...current, banner: undefined }));
  };

  const handleBannerRemove = () => {
    if (!formOwner.documentIsCurrent(formOwner.documentKey)) return;
    banner.remove();
  };

  const hardDisabled =
    isLoading ||
    isPending ||
    contentSchemaError !== undefined ||
    (isEditMode && !hasCurrentEditingPortfolio);
  const actionBlockReason = managedContentActionBlockReason({
    editorBusy: editorState.busy,
    pendingAssetCount: editorState.pendingAssetCount,
  });
  const actionDisabled = hardDisabled || actionBlockReason !== undefined;

  const savePortfolio = async (status: PortfolioStatus) => {
    if (actionDisabled) return;
    if (isEditMode && !hasCurrentEditingPortfolio) {
      setGlobalError("저장할 Portfolio를 먼저 불러와야 합니다.");
      return;
    }

    const nextForm = { ...formOwner.form, status };
    const built = buildPortfolioInput(nextForm);
    setFieldErrors(built.errors);
    if (!built.input) {
      setGlobalError("입력값을 확인해 주세요.");
      return;
    }
    const candidate = built.input;

    const imageIssue = validateManagedContentImagesForPublish(
      supabaseConfig,
      "portfolio",
      candidate,
    );
    if (imageIssue) {
      setFieldErrors((current) => ({ ...current, content: imageIssue }));
      setGlobalError("본문 이미지를 확인해 주세요.");
      return;
    }

    const thumbnailFile = thumbnail.selection.selected?.file;
    if (thumbnailFile) {
      const dimensions = await validateAdminImageDimensions(
        thumbnailFile,
        "thumbnail",
        { height: 800, width: 1080 },
      );
      if (!dimensions.ok) {
        setFieldErrors((current) => ({
          ...current,
          thumbnail: dimensions.error.message,
        }));
        setGlobalError("썸네일 이미지 비율을 확인해 주세요.");
        return;
      }
    }

    const bannerFile = banner.selection.selected?.file;
    if (bannerFile) {
      const dimensions = await validateAdminImageDimensions(
        bannerFile,
        "banner",
        { height: 800, width: 1080 },
      );
      if (!dimensions.ok) {
        setFieldErrors((current) => ({
          ...current,
          banner: dimensions.error.message,
        }));
        setGlobalError("배너 이미지 비율을 확인해 주세요.");
        return;
      }
    }

    const existingPortfolio = editingPortfolio;
    if (isEditMode && !existingPortfolio) {
      setGlobalError("저장할 Portfolio를 먼저 불러와야 합니다.");
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

    setIsPending(true);
    setGlobalError(undefined);
    setCleanupWarning(undefined);
    setSuccessMessage(undefined);

    const outcome = await persistThumbnailChange({
      config: supabaseConfig,
      current: {
        path: existingPortfolio?.thumbnail_path ?? null,
        publicUrl: existingPortfolio?.thumbnail_public_url ?? null,
      },
      removed: thumbnail.selection.removed,
      save: async (nextThumbnail, nextBanner) => {
        if (
          operationController.signal.aborted ||
          !operationIsCurrent(operation) ||
          !formOwner.ownerIsCurrent(owner)
        ) {
          return adminErr(saveFailure());
        }

        const input: PortfolioCreateInput = {
          ...candidate,
          bannerPath:
            nextBanner === undefined
              ? (existingPortfolio?.banner_path ?? null)
              : nextBanner.path,
          bannerPublicUrl:
            nextBanner === undefined
              ? (existingPortfolio?.banner_public_url ?? null)
              : nextBanner.publicUrl,
          thumbnailPath: nextThumbnail.path,
          thumbnailPublicUrl: nextThumbnail.publicUrl,
        };
        return existingPortfolio
          ? updatePortfolio(supabaseConfig, existingPortfolio.id, input, {
              signal: operationController.signal,
            })
          : createPortfolio(supabaseConfig, input, {
              signal: operationController.signal,
            });
      },
      selected: thumbnail.selection.selected,
      secondary: {
        current: {
          path: existingPortfolio?.banner_path ?? null,
          publicUrl: existingPortfolio?.banner_public_url ?? null,
        },
        removed: banner.selection.removed,
        selected: banner.selection.selected,
      },
      slug: candidate.slug,
    });

    if (!operationIsCurrent(operation) || !formOwner.ownerIsCurrent(owner)) {
      return;
    }

    const warning = thumbnailCleanupWarning(outcome.cleanupIssues);
    setCleanupWarning(warning);
    if (!outcome.result.ok) {
      const failure = outcome.result.error;
      formOwner.unlockOwner(owner);
      releaseOperation();
      setIsPending(false);
      if (failure.kind === "duplicate_slug") {
        setFieldErrors((current) => ({
          ...current,
          slug: failure.message,
        }));
      }
      setGlobalError(adminFailureMessage(failure));
      return;
    }

    let savedForm: PortfolioFormState;
    try {
      savedForm = portfolioFormFromRow(outcome.result.value);
    } catch (error) {
      if (error instanceof ManagedContentSchemaError) {
        formOwner.unlockOwner(owner);
        releaseOperation();
        setIsPending(false);
        setContentSchemaError(error.message);
        setGlobalError(error.message);
        return;
      }
      throw error;
    }

    if (!formOwner.acceptSaved(owner, outcome.result.value, savedForm)) return;
    releaseOperation();
    setIsPending(false);
    setEditingPortfolio(outcome.result.value);
    thumbnail.reset(outcome.result.value.thumbnail_public_url);
    banner.reset(outcome.result.value.banner_public_url);
    setFieldErrors({});
    setSuccessMessage(
      existingPortfolio
        ? "Portfolio를 저장했습니다."
        : "Portfolio를 등록했습니다.",
    );

    if (
      (route.id !== "portfolioDetail" ||
        route.param !== outcome.result.value.slug) &&
      operationIsCurrent(operation) &&
      formOwner.ownerIsCurrent(owner)
    ) {
      onNavigate(`/portfolio/${outcome.result.value.slug}`);
    }
  };

  const deleteCurrentPortfolio = async () => {
    if (
      actionDisabled ||
      !isEditMode ||
      !hasCurrentEditingPortfolio ||
      !editingPortfolio ||
      !window.confirm("이 Portfolio를 삭제하시겠습니까?")
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

    setIsPending(true);
    const outcome = await deletePortfolioWithStorageCleanup(
      supabaseConfig,
      editingPortfolio.id,
      {
        signal: operationController.signal,
      },
    );
    if (!operationIsCurrent(operation) || !formOwner.ownerIsCurrent(owner)) {
      return;
    }
    releaseOperation();
    setIsPending(false);
    if (!outcome.result.ok) {
      formOwner.unlockOwner(owner);
      setGlobalError(adminFailureMessage(outcome.result.error));
      return;
    }
    formOwner.unlockOwner(owner);
    onNavigate("/portfolio");
  };

  return (
    <section
      aria-labelledby="portfolio-form-title"
      className={styles.portfolioFormSection}
    >
      <div className={styles.portfolioFormPanel} aria-busy={isPending}>
        <div className={styles.portfolioFormLayout}>
          <div className={styles.portfolioFormBody}>
            <h1 className={styles.portfolioFormTitle} id="portfolio-form-title">
              {isEditMode ? "포트폴리오 수정" : "신규 포트폴리오 등록"}
            </h1>
            {globalError ? (
              <p className={styles.globalError} role="alert">
                {globalError}
              </p>
            ) : null}
            {cleanupWarning ? (
              <p className={styles.cleanupWarning} role="status">
                {cleanupWarning}
              </p>
            ) : null}
            {successMessage ? (
              <p className={styles.successMessage} role="status">
                {successMessage}
              </p>
            ) : null}
            {isLoading ? (
              <p className={styles.loadingText}>
                Portfolio 상세 정보를 불러오는 중입니다.
              </p>
            ) : null}
            <PortfolioFormFields
              banner={banner.selection}
              contentPreviewContainer={contentPreviewContainer}
              documentKey={formOwner.documentKey}
              fieldErrors={fieldErrors}
              form={formOwner.form}
              isDisabled={hardDisabled}
              onBannerChange={handleBannerChange}
              onBannerRemove={handleBannerRemove}
              onContentBusyChange={editorState.onBusyChange}
              onContentChange={handleContentChange}
              onFormChange={handleFormChange}
              onPendingAssetCountChange={editorState.onPendingAssetCountChange}
              onThumbnailChange={handleThumbnailChange}
              onThumbnailRemove={handleThumbnailRemove}
              thumbnail={thumbnail.selection}
            />
          </div>
          <aside
            aria-label="포트폴리오 본문 미리보기"
            className={styles.portfolioPreviewColumn}
          >
            <div
              className={styles.portfolioPreviewMount}
              ref={setContentPreviewContainerRef}
            />
          </aside>
        </div>
        <div className={styles.portfolioActionArea}>
          {actionBlockReason ? (
            <p className={styles.actionBlockReason} role="status">
              {actionBlockReason}
            </p>
          ) : null}
          <div className={styles.portfolioFormActions}>
            <AdminButton
              className={`${styles.portfolioFormActionButton} ${styles.portfolioFormBackButton} ${styles.portfolioFormSecondaryAction}`}
              disabled={actionDisabled}
              onClick={() => onNavigate("/portfolio")}
              size="figma"
              variant="secondary"
            >
              목록으로
            </AdminButton>
            <div className={styles.portfolioFormActionGroup}>
              {isEditMode ? (
                <AdminButton
                  className={styles.portfolioFormActionButton}
                  disabled={actionDisabled || !hasCurrentEditingPortfolio}
                  icon={<AdminTrashIcon size={16} />}
                  onClick={deleteCurrentPortfolio}
                  size="figma"
                  variant="danger"
                >
                  삭제
                </AdminButton>
              ) : null}
              <AdminButton
                className={`${styles.portfolioFormActionButton} ${styles.portfolioFormDraftButton} ${styles.portfolioFormSecondaryAction}`}
                disabled={actionDisabled}
                onClick={() => savePortfolio("draft")}
                size="figma"
                variant="secondary"
              >
                임시저장
              </AdminButton>
              <AdminButton
                className={`${styles.portfolioFormActionButton} ${styles.portfolioFormSubmitButton}`}
                disabled={actionDisabled}
                icon={<AdminArrowRightIcon size={16} />}
                iconPosition="right"
                onClick={() => savePortfolio("published")}
                size="figma"
              >
                {isPending ? "저장 중" : isEditMode ? "수정하기" : "등록하기"}
              </AdminButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
