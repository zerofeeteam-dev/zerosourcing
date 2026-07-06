import { Icon, type IconName } from "./Icon";
import styles from "./ServiceCard.module.css";

type ServiceCardProps = {
  actionLabel?: string;
  badge?: string;
  description: string[];
  headline: string;
  iconName?: IconName;
  title?: string;
};

export function ServiceCard({
  actionLabel = "자세히 보기",
  badge,
  description,
  headline,
  iconName,
  title,
}: ServiceCardProps) {
  const hasHeader = Boolean(title || iconName || badge);

  return (
    <article className={`${styles.card} ${hasHeader ? "" : styles.centered}`}>
      {hasHeader ? (
        <div className={styles.header}>
          {title || iconName ? (
            <div className={styles.titleGroup}>
              {iconName ? (
                <span className={styles.iconFrame}>
                  <Icon name={iconName} size={20} />
                </span>
              ) : null}
              {title ? <h3 className={styles.title}>{title}</h3> : null}
            </div>
          ) : null}
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </div>
      ) : null}
      <div className={styles.copy}>
        <p className={styles.headline}>{headline}</p>
        <p className={styles.description}>
          {description.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>
      <button className={styles.action} type="button">
        {actionLabel}
        <Icon name="arrow-right" size={16} />
      </button>
    </article>
  );
}
