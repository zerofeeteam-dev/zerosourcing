import type { FormEvent } from "react";
import { useState } from "react";
import type { LoginCredentials } from "../lib/auth";
import type { SupabaseDisabledConfig } from "../lib/supabase";
import styles from "./LoginPage.module.css";

const logoSrc = "/figma-assets/zerosourcing-logo.svg";

type LoginPageProps = {
  readonly authError?: string;
  readonly isLoading: boolean;
  readonly onSubmit: (credentials: LoginCredentials) => Promise<void>;
  readonly setupBlock?: SupabaseDisabledConfig;
};

type LoginFormErrors = {
  readonly email?: string;
  readonly password?: string;
};

function validateLoginForm(email: string, password: string): LoginFormErrors {
  return {
    email: email ? undefined : "이메일을 입력해주세요.",
    password: password ? undefined : "비밀번호를 입력해주세요.",
  };
}

function hasErrors(errors: LoginFormErrors): boolean {
  return Boolean(errors.email || errors.password);
}

export function LoginPage({ authError, isLoading, onSubmit, setupBlock }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const isSetupBlocked = Boolean(setupBlock);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateLoginForm(email.trim(), password);
    setErrors(nextErrors);
    if (hasErrors(nextErrors) || isSetupBlocked) return;

    void onSubmit({ email: email.trim(), password });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a aria-label="Zerosourcing Admin Login" className={styles.logoLink} href="/login">
          <img
            alt="zeroSourcing"
            className={styles.logoImage}
            height={24}
            src={logoSrc}
            width={168}
          />
        </a>
        <nav aria-label="Public links" className={styles.nav}>
          <a className={styles.navLink} href="/blog">
            Blog
          </a>
          <a className={styles.navLink} href="/portfolio">
            Portfolio
          </a>
        </nav>
      </header>

      <section aria-labelledby="login-title" className={styles.loginSection}>
        <div className={styles.formHeader}>
          <a aria-label="Zerosourcing Admin Login" className={styles.centerLogo} href="/login">
            <img
              alt="zeroSourcing"
              className={styles.logoImage}
              height={24}
              src={logoSrc}
              width={168}
            />
          </a>
          <h1 className={styles.title} id="login-title">
            제로소싱 Admin Login
          </h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {setupBlock ? (
            <div className={styles.setupNotice} role="status">
              <strong className={styles.noticeTitle}>Supabase 설정 대기</strong>
              <span className={styles.noticeMessage}>{setupBlock.message}</span>
            </div>
          ) : null}

          {authError ? (
            <div className={styles.authError} role="alert">
              {authError}
            </div>
          ) : null}

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="admin-email">
              이메일
            </label>
            <input
              aria-describedby={errors.email ? "admin-email-error" : undefined}
              aria-invalid={errors.email ? true : undefined}
              autoComplete="email"
              className={styles.input}
              disabled={isLoading || isSetupBlocked}
              id="admin-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일을 입력해주세요."
              type="email"
              value={email}
            />
            {errors.email ? (
              <p className={styles.errorText} id="admin-email-error">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="admin-password">
              비밀번호
            </label>
            <input
              aria-describedby={errors.password ? "admin-password-error" : undefined}
              aria-invalid={errors.password ? true : undefined}
              autoComplete="current-password"
              className={styles.input}
              disabled={isLoading || isSetupBlocked}
              id="admin-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력해주세요."
              type="password"
              value={password}
            />
            {errors.password ? (
              <p className={styles.errorText} id="admin-password-error">
                {errors.password}
              </p>
            ) : null}
          </div>

          <button
            className={styles.submitButton}
            disabled={isLoading || isSetupBlocked}
            type="submit"
          >
            {isLoading ? "로그인 중" : "로그인"}
          </button>
        </form>
      </section>

      <footer className={styles.footer}>
        <img
          alt="zeroSourcing"
          className={styles.footerLogo}
          height={24}
          src={logoSrc}
          width={168}
        />

        <span aria-hidden="true" className={styles.divider} />

        <div className={styles.policyGroup}>
          <p>이용약관</p>
          <p className={styles.bold}>개인정보처리방침</p>
          <div className={styles.customerGroup}>
            <p>고객센터</p>
            <p>전화번호 : 010-3242-8118</p>
            <p>주중 09~18시 (점심시간 12~13시 30분 / 주말 및 공휴일 제외)</p>
          </div>
        </div>

        <span aria-hidden="true" className={styles.divider} />

        <div className={styles.companyGroup}>
          <p>제로피(제로소싱) | 사업자등록번호 : 487-28-01888 | 대표 : 이동규</p>
          <p>
            주소 : 경기도 고양시 덕양구 동축로70, A동 9층 901호(동산동,
            현대프리미어캠퍼스)
          </p>
          <p>개인정보처리담당자 : 이동규 | 통신판매업신고번호 : 2026-고양덕양구-1043</p>
          <p>메일 : contact@zerofee.kr</p>
          <p className={styles.bold}>Copyright ⓒ 2026 zerofee. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
