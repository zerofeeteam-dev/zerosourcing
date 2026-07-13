import { useEffect, useState } from "react";
import {
  AdminArrowRightIcon,
  AdminButton,
  AdminTrashIcon,
} from "../../components/admin";
import { adminFailureMessage } from "../../lib/adminErrors";
import {
  createPortfolio,
  deletePortfolio,
  getPortfolioBySlug,
  updatePortfolio,
} from "../../lib/portfolioRepository";
import { supabaseConfig } from "../../lib/supabase";
import {
  buildPortfolioInput,
  emptyPortfolioFormState,
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
  const [form, setForm] = useState<PortfolioFormState>(emptyPortfolioFormState);
  const [editingId, setEditingId] = useState<string>();
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isPending, setIsPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PortfolioFormErrors>({});
  const [globalError, setGlobalError] = useState<string>();

  useEffect(() => {
    if (!isEditMode) return;

    const controller = new AbortController();
    let isActive = true;
    setIsLoading(true);

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
      setEditingId(result.value.id);
      setForm(portfolioFormFromRow(result.value));
      setGlobalError(undefined);
    });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isEditMode, route]);

  const isDisabled = isLoading || isPending;

  const savePortfolio = async (status: PortfolioStatus) => {
    setFieldErrors({});
    setGlobalError(undefined);

    const nextForm = { ...form, status };
    const built = buildPortfolioInput(nextForm);
    if (!built.input) {
      setFieldErrors(built.errors);
      setGlobalError("입력값을 확인해 주세요.");
      return;
    }

    setIsPending(true);
    const result =
      isEditMode && editingId
        ? await updatePortfolio(supabaseConfig, editingId, built.input)
        : await createPortfolio(supabaseConfig, built.input);
    setIsPending(false);

    if (!result.ok) {
      if (result.error.kind === "duplicate_slug") {
        setFieldErrors({ slug: result.error.message });
      }
      setGlobalError(adminFailureMessage(result.error));
      return;
    }

    setForm(portfolioFormFromRow(result.value));
    setEditingId(result.value.id);
    onNavigate(`/portfolio/${result.value.slug}`);
  };

  const deleteCurrentPortfolio = async () => {
    if (!isEditMode || !editingId) return;
    if (!window.confirm("이 Portfolio를 삭제하시겠습니까?")) return;

    setIsPending(true);
    const result = await deletePortfolio(supabaseConfig, editingId);
    setIsPending(false);

    if (!result.ok) {
      setGlobalError(adminFailureMessage(result.error));
      return;
    }

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
            disabled={isDisabled}
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
                disabled={isDisabled || !editingId}
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
