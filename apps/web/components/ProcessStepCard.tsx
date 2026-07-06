import { Icon, type IconName } from "./Icon";
import styles from "./ProcessStepCard.module.css";

type ProcessStepCardProps = {
  description: string;
  duration: string;
  iconName: IconName;
  title: string;
};

export function ProcessStepCard({
  description,
  duration,
  iconName,
  title,
}: ProcessStepCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.heading}>
        <span className={styles.iconFrame} aria-hidden="true">
          <Icon name={iconName} size={20} />
        </span>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.body}>
        <p className={styles.description}>{description}</p>
        <p className={styles.duration}>{duration}</p>
      </div>
    </article>
  );
}
