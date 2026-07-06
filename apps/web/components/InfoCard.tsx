import styles from "./InfoCard.module.css";

type InfoCardProps = {
  className?: string;
  eyebrow: string;
  title: string;
  description: string[];
};

export function InfoCard({
  className,
  description,
  eyebrow,
  title,
}: InfoCardProps) {
  const cardClassName = className ? `${styles.card} ${className}` : styles.card;

  return (
    <article className={cardClassName}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <div className={styles.copy}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>
            {description.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>
      </div>
    </article>
  );
}
