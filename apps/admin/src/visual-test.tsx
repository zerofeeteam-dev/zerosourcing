import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../design-system.css";
import "./App.css";
import {
  AdminArrowRightIcon,
  AdminButton,
  AdminFormActions,
  AdminFormPage,
  AdminShell,
} from "./components/admin";
import { BlogFormFields } from "./pages/blog/BlogFormFields";
import type { BlogFormState } from "./pages/blog/blogTypes";
import styles from "./pages/BlogAdminPage.module.css";

const initialForm: BlogFormState = {
  bannerPublished: true,
  bannerSections: '[{"id":1},{"id":2}]',
  content: "",
  contentMode: "html",
  landingPublished: true,
  landingSections: '[{"id":1},{"id":2},{"id":3}]',
  publishedDate: "",
  seoDescription: "",
  slug: "",
  status: "draft",
  thumbnailAlt: "",
  title: "",
  type: "",
};

function VisualTest() {
  const [form, setForm] = useState(initialForm);

  return (
    <AdminShell activeItem="blog">
      <AdminFormPage
        actions={
          <AdminFormActions
            leading={
              <AdminButton className={styles.formActionButton} size="figma" variant="secondary">
                목록으로
              </AdminButton>
            }
            trailing={
              <>
                <AdminButton className={styles.formActionButton} size="figma" variant="secondary">
                  임시저장
                </AdminButton>
                <AdminButton
                  className={`${styles.formActionButton} ${styles.submitActionButton}`}
                  icon={<AdminArrowRightIcon size={16} />}
                  iconPosition="right"
                  size="figma"
                >
                  등록하기
                </AdminButton>
              </>
            }
          />
        }
        title="신규 블로그 등록"
      >
        <BlogFormFields
          fieldErrors={{}}
          form={form}
          isDisabled={false}
          onFieldChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
          onThumbnailChange={() => undefined}
          onThumbnailRemove={() => undefined}
          thumbnail={{ removed: false }}
        />
      </AdminFormPage>
    </AdminShell>
  );
}

createRoot(document.getElementById("root")!).render(<VisualTest />);
