"use client";

import { Button } from "@repo/ui/button";

import styles from "./error.module.css";

type ErrorPageProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className={styles.page}>
      <section aria-live="assertive" className={styles.panel} role="alert">
        <p className={styles.message}>콘텐츠를 불러오지 못했습니다.</p>
        <div className={styles.actions}>
          <Button onClick={reset} variant="gradient">
            다시 시도
          </Button>
        </div>
      </section>
    </main>
  );
}
