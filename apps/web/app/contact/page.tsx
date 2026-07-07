"use client";

import type { CSSProperties, FormEvent } from "react";
import { Button } from "@repo/ui/button";

import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { Icon } from "../../components/Icon";
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
    placeholder: "연락처를 입력해주세요.",
    type: "tel",
  },
] as const;

const contactMethods = ["카카오톡·문자", "이메일", "전화"] as const;

const submitButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
  width: "100%",
} satisfies CSSProperties;

export default function ContactPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const body = [
      ["기업명", formData.get("company")],
      ["담당자 성함", formData.get("name")],
      ["이메일", formData.get("email")],
      ["연락처", formData.get("phone")],
      ["연락 방법", formData.get("contactMethod")],
      ["예산", formData.get("budget")],
      ["추가 내용", formData.get("message")],
    ]
      .map(([label, value]) => `${label}: ${value || ""}`)
      .join("\n");

    window.location.href = `mailto:contact@zerofee.kr?subject=${encodeURIComponent(
      "[제로소싱] 외주 문의",
    )}&body=${encodeURIComponent(body)}`;
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
                      name={field.id}
                      placeholder={field.placeholder}
                      required
                      type={field.type}
                    />
                  </label>
                ))}
              </div>

              <fieldset className={styles.methodGroup}>
                <legend className={styles.label}>연락 방법*</legend>
                <div className={styles.radioList}>
                  {contactMethods.map((method, index) => (
                    <label className={styles.radioItem} key={method}>
                      <input
                        className={styles.radioInput}
                        defaultChecked={index === 0}
                        name="contactMethod"
                        required
                        type="radio"
                        value={method}
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className={styles.field} htmlFor="budget">
                <span className={styles.label}>예산*</span>
                <span className={styles.budgetControl}>
                  <input
                    className={styles.budgetInput}
                    id="budget"
                    inputMode="numeric"
                    name="budget"
                    placeholder="예산 범위를 입력해주세요."
                    required
                    type="text"
                  />
                  <span className={styles.budgetUnit}>만 원</span>
                </span>
              </label>

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
                <label className={styles.checkboxItem}>
                  <input className={styles.checkboxInput} required type="checkbox" />
                  <span>개인정보 수집 및 이용 동의</span>
                </label>
                <button className={styles.privacyLink} type="button">
                  보기
                </button>
              </div>
            </div>

            <Button
              color="blue"
              iconSize={24}
              leftIcon={<Icon name="edit-03" size={24} />}
              style={submitButtonStyle}
              type="submit"
              variant="gradient"
            >
              외주 문의하기
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}
