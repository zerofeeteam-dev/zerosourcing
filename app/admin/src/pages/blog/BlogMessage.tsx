import styles from "../BlogAdminPage.module.css";

type BlogMessageProps = {
  readonly message: string;
  readonly tone: "error" | "success";
};

export function BlogMessage({ message, tone }: BlogMessageProps) {
  return (
    <div
      className={`${styles.message} ${tone === "error" ? styles.messageError : styles.messageSuccess}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <p className={styles.messageTitle}>{tone === "error" ? "처리 실패" : "완료"}</p>
      <p className={styles.messageText}>{message}</p>
    </div>
  );
}
