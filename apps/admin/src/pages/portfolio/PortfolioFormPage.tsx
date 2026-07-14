import { useEffect, useRef, useState } from "react";
import {
  AdminArrowRightIcon,
  AdminButton,
  AdminTrashIcon,
} from "../../components/admin";
import { adminFailureMessage } from "../../lib/adminErrors";
import { ManagedContentSchemaError } from "../../lib/managedContent";
import {
  createOperationGeneration,
  type OperationGeneration,
  type OperationToken,
} from "../../lib/operationGeneration";
import {
  createPortfolio,
  deletePortfolio,
  getPortfolioBySlug,
  updatePortfolio,
} from "../../lib/portfolioRepository";
import { supabaseConfig } from "../../lib/supabase";
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
import type { PortfolioStatus } from "../../lib/adminRepositoryTypes";
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
  const [form, setForm] = useState<PortfolioFormState>(() =>
    createEmptyPortfolioFormState(),
  );
  const [editingId, setEditingId] = useState<string>();
  const [editingRouteParam, setEditingRouteParam] = useState<string>();
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isPending, setIsPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PortfolioFormErrors>({});
  const [globalError, setGlobalError] = useState<string>();
  const [contentSchemaError, setContentSchemaError] = useState<string>();
  const previousRouteId = useRef(route.id);
  const mutationControllerRef = useRef<AbortController | null>(null);
  const operationGenerationRef = useRef<OperationGeneration | null>(null);
  if (operationGenerationRef.current === null) {
    operationGenerationRef.current = createOperationGeneration();
  }
  const operationGeneration = operationGenerationRef.current;
  const routeKey =
    route.id === "portfolioDetail"
      ? `portfolio:detail:${route.param}`
      : "portfolio:new";
  const currentRouteKeyRef = useRef(routeKey);
  currentRouteKeyRef.current = routeKey;
  const operationIsCurrent = (operation: OperationToken) =>
    operationGeneration.isCurrent(operation, currentRouteKeyRef.current);
  const hasCurrentEditingPortfolio =
    route.id === "portfolioDetail" &&
    editingId !== undefined &&
    editingRouteParam === route.param;

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
    const previousId = previousRouteId.current;
    previousRouteId.current = route.id;
    if (route.id !== "portfolioNew" || previousId === "portfolioNew") return;

    setForm(createEmptyPortfolioFormState());
    setEditingId(undefined);
    setEditingRouteParam(undefined);
    setFieldErrors({});
    setGlobalError(undefined);
    setContentSchemaError(undefined);
    setIsLoading(false);
  }, [route.id]);

  useEffect(() => {
    if (!isEditMode) return;

    const controller = new AbortController();
    let isActive = true;
    setIsLoading(true);
    setEditingId(undefined);
    setEditingRouteParam(undefined);
    setFieldErrors({});
    setGlobalError(undefined);
    setContentSchemaError(undefined);

    void getPortfolioBySlug(supabaseConfig, route.param, {
      signal: controller.signal,
    }).then((result) => {
      if (!isActive) return;
      setIsLoading(false);
      if (!result.ok) {
        setGlobalError(adminFailureMessage(result.error));
        return;
      }
      if (!result.value) {
        setGlobalError("해당 slug의 Portfolio를 찾을 수 없습니다.");
        return;
      }
      try {
        setForm(portfolioFormFromRow(result.value));
      } catch (error) {
        if (error instanceof ManagedContentSchemaError) {
          setContentSchemaError(error.message);
          setGlobalError(error.message);
          return;
        }
        throw error;
      }
      setEditingId(result.value.id);
      setEditingRouteParam(route.param);
      setGlobalError(undefined);
    });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isEditMode, route]);

  const isDisabled =
    isLoading ||
    isPending ||
    contentSchemaError !== undefined ||
    (isEditMode && !hasCurrentEditingPortfolio);

  const savePortfolio = async (status: PortfolioStatus) => {
    if (isLoading || isPending || contentSchemaError) return;
    if (isEditMode && (!hasCurrentEditingPortfolio || !editingId)) {
      setGlobalError("저장할 Portfolio를 먼저 불러와야 합니다.");
      return;
    }
    setFieldErrors({});
    setGlobalError(undefined);

    const nextForm = { ...form, status };
    const built = buildPortfolioInput(nextForm);
    if (!built.input) {
      setFieldErrors(built.errors);
      setGlobalError("입력값을 확인해 주세요.");
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

    setIsPending(true);
    let result: Awaited<ReturnType<typeof createPortfolio>>;
    if (isEditMode) {
      if (!editingId || !hasCurrentEditingPortfolio) {
        releaseOperation();
        setIsPending(false);
        setGlobalError("저장할 Portfolio를 먼저 불러와야 합니다.");
        return;
      }
      result = await updatePortfolio(supabaseConfig, editingId, built.input, {
        signal: operationController.signal,
      });
    } else {
      result = await createPortfolio(supabaseConfig, built.input, {
        signal: operationController.signal,
      });
    }
    if (!operationIsCurrent(operation)) return;
    releaseOperation();
    setIsPending(false);

    if (!result.ok) {
      if (result.error.kind === "duplicate_slug") {
        setFieldErrors({ slug: result.error.message });
      }
      setGlobalError(adminFailureMessage(result.error));
      return;
    }

    try {
      setForm(portfolioFormFromRow(result.value));
    } catch (error) {
      if (error instanceof ManagedContentSchemaError) {
        setContentSchemaError(error.message);
        setGlobalError(error.message);
        return;
      }
      throw error;
    }
    setEditingId(result.value.id);
    setEditingRouteParam(result.value.slug);
    if (!operationIsCurrent(operation)) return;
    onNavigate(`/portfolio/${result.value.slug}`);
  };

  const deleteCurrentPortfolio = async () => {
    if (
      !isEditMode ||
      !hasCurrentEditingPortfolio ||
      !editingId ||
      isLoading ||
      isPending ||
      contentSchemaError
    ) {
      return;
    }
    if (!window.confirm("이 Portfolio를 삭제하시겠습니까?")) return;

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
    const result = await deletePortfolio(supabaseConfig, editingId, {
      signal: operationController.signal,
    });
    if (!operationIsCurrent(operation)) return;
    releaseOperation();
    setIsPending(false);

    if (!result.ok) {
      setGlobalError(adminFailureMessage(result.error));
      return;
    }

    if (!operationIsCurrent(operation)) return;
    onNavigate("/portfolio");
  };

  return (
    <section
      className={styles.portfolioFormSection}
      aria-labelledby="portfolio-form-title"
    >
      <div className={styles.portfolioFormPanel} aria-busy={isPending}>
        <div className={styles.portfolioFormBody}>
          <h1 className={styles.portfolioFormTitle} id="portfolio-form-title">
            {isEditMode ? "포트폴리오 수정" : "신규 포트폴리오 등록"}
          </h1>
          {globalError ? (
            <p className={styles.globalError}>{globalError}</p>
          ) : null}
          {isLoading ? (
            <p className={styles.loadingText}>
              Portfolio 상세 정보를 불러오는 중입니다.
            </p>
          ) : null}
          <PortfolioFormFields
            fieldErrors={fieldErrors}
            form={form}
            isDisabled={isDisabled}
            onFormChange={setForm}
          />
        </div>
        <div className={styles.portfolioFormActions}>
          <AdminButton
            className={`${styles.portfolioFormActionButton} ${styles.portfolioFormBackButton} ${styles.portfolioFormSecondaryAction}`}
            disabled={isLoading || isPending}
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
                disabled={isDisabled || !hasCurrentEditingPortfolio}
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
              disabled={isDisabled}
              onClick={() => savePortfolio("draft")}
              size="figma"
              variant="secondary"
            >
              임시저장
            </AdminButton>
            <AdminButton
              className={`${styles.portfolioFormActionButton} ${styles.portfolioFormSubmitButton}`}
              disabled={isDisabled}
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
    </section>
  );
}
