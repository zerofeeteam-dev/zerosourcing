"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  useState,
} from "react";
import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";
import { Radio } from "@repo/ui/radio";

import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { Icon } from "../../components/Icon";
import { trackMetaLead } from "../../lib/meta-pixel";
import pageStyles from "../page.module.css";
import styles from "./page.module.css";

const textFields = [
  {
    autoComplete: "organization",
    id: "company",
    label: "기업명*",
    placeholder: "기업명을 입력해주세요.",
    type: "text",
  },
  {
    autoComplete: "name",
    id: "name",
    label: "담당자 성함*",
    placeholder: "성함을 입력해주세요.",
    type: "text",
  },
  {
    autoComplete: "email",
    id: "email",
    label: "이메일*",
    placeholder: "이메일을 입력해주세요.",
    type: "email",
  },
  {
    autoComplete: "tel",
    id: "phone",
    label: "연락처*",
    placeholder: "010-0000-000",
    type: "tel",
  },
] as const;

const contactMethods = ["카카오톡·문자", "이메일", "전화"] as const;

const submitButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
  width: "100%",
} satisfies CSSProperties;

const contactMethodStyle = {
  width: 136,
} satisfies CSSProperties;

const privacyCheckboxStyle = {
  width: "auto",
} satisfies CSSProperties;

type SubmitStatus = "error" | "idle" | "success";

function formatBudgetInput(value: string) {
  return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      budget: formData.get("budget"),
      company: formData.get("company"),
      contactMethod: formData.get("contactMethod"),
      email: formData.get("email"),
      message: formData.get("message"),
      name: formData.get("name"),
      phone: formData.get("phone"),
      privacyConsent: formData.get("privacyConsent") === "true",
    };

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to submit contact form");

      trackMetaLead();
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBudgetChange(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.value = formatBudgetInput(event.currentTarget.value);
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.value = formatPhoneInput(event.currentTarget.value);
  }

  return (
    <main className={pageStyles.page}>
      <div className={pageStyles.headerLayer}>
        <Header />
      </div>

      <section className={styles.section} aria-labelledby="contact-title">
        <div className={styles.inner}>
          <div className={styles.copy}>
            <h1 className={styles.title} id="contact-title">
              <span>부담은 제로, 출시는 현실로</span>
              <span>
                상담을 신청해주시면
                <br />
                1영업일 이내로 답변드리겠습니다
              </span>
            </h1>
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <div className={styles.twoColumn}>
                {textFields.slice(0, 2).map((field) => (
                  <label className={styles.field} htmlFor={field.id} key={field.id}>
                    <span className={styles.label}>{field.label}</span>
                    <input
                      autoComplete={field.autoComplete}
                      className={styles.control}
                      id={field.id}
                      name={field.id}
                      placeholder={field.placeholder}
                      required
                      type={field.type}
                    />
                  </label>
                ))}
              </div>

              <div className={styles.twoColumn}>
                {textFields.slice(2).map((field) => (
                  <label className={styles.field} htmlFor={field.id} key={field.id}>
                    <span className={styles.label}>{field.label}</span>
                    <input
                      autoComplete={field.autoComplete}
                      className={styles.control}
                      id={field.id}
                      inputMode={field.id === "phone" ? "numeric" : undefined}
                      maxLength={field.id === "phone" ? 13 : undefined}
                      name={field.id}
                      onChange={
                        field.id === "phone" ? handlePhoneChange : undefined
                      }
                      pattern={
                        field.id === "phone"
                          ? "010-[0-9]{4}-[0-9]{3,4}"
                          : undefined
                      }
                      placeholder={field.placeholder}
                      required
                      title={
                        field.id === "phone"
                          ? "010-0000-000 형식으로 입력해주세요."
                          : undefined
                      }
                      type={field.type}
                    />
                  </label>
                ))}
              </div>

              <div className={styles.methodBudgetGroup}>
                <div
                  aria-labelledby="contact-method-label"
                  aria-required="true"
                  className={styles.methodGroup}
                  role="radiogroup"
                >
                  <span className={styles.label} id="contact-method-label">
                    연락 방법*
                  </span>
                  <div className={styles.radioList}>
                    {contactMethods.map((method, index) => (
                      <Radio
                        defaultChecked={index === 0}
                        key={method}
                        label={method}
                        name="contactMethod"
                        required
                        style={contactMethodStyle}
                        value={method}
                      />
                    ))}
                  </div>
                </div>

                <label className={styles.field} htmlFor="budget">
                  <span className={styles.label}>예산*</span>
                  <span className={styles.budgetControl}>
                    <input
                      className={styles.budgetInput}
                      id="budget"
                      inputMode="numeric"
                      name="budget"
                      onChange={handleBudgetChange}
                      placeholder="예산 범위를 입력해주세요."
                      required
                      type="text"
                    />
                    <span className={styles.budgetUnit}>만 원</span>
                  </span>
                </label>
              </div>

              <label className={styles.field} htmlFor="message">
                <span className={styles.label}>추가 내용(선택)</span>
                <textarea
                  className={styles.textarea}
                  id="message"
                  name="message"
                  placeholder="아이디어나 궁금하신 사항을 작성해주시면 해당 내용을 중심으로 상담 도와드리겠습니다."
                />
              </label>

              <div className={styles.privacyRow}>
                <Checkbox
                  label="개인정보 수집 및 이용 동의"
                  name="privacyConsent"
                  required
                  style={privacyCheckboxStyle}
                  value="true"
                />
                <button className={styles.privacyLink} type="button">
                  보기
                </button>
              </div>
              {submitStatus !== "idle" ? (
                <p
                  aria-live="polite"
                  className={[
                    styles.statusMessage,
                    submitStatus === "success"
                      ? styles.statusSuccess
                      : styles.statusError,
                  ].join(" ")}
                >
                  {submitStatus === "success"
                    ? "문의가 접수되었습니다."
                    : "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요."}
                </p>
              ) : null}
            </div>

            <Button
              color="blue"
              disabled={isSubmitting}
              iconSize={24}
              leftIcon={<Icon name="edit-03" size={24} />}
              style={submitButtonStyle}
              type="submit"
              variant="gradient"
            >
              {isSubmitting ? "접수 중..." : "외주 문의하기"}
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}
