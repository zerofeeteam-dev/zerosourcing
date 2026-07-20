"use client";

import Link from "next/link";

import { Icon, type IconName } from "./Icon";
import {
  type CtaAction,
  emitCtaEvent,
  getCtaHref,
} from "./cta-events";
import styles from "./ServiceCard.module.css";

export type ServiceCardData = {
  action: CtaAction;
  actionLabel?: string;
  badge?: string;
  description: readonly string[];
  headline: string;
  iconName?: IconName;
  title?: string;
};

export function ServiceCard({
  action,
  actionLabel = "자세히 보기",
  badge,
  description,
  headline,
  iconName,
  title,
}: ServiceCardData) {
  const hasHeader = Boolean(title || iconName || badge);

  return (
    <Link
      className={`${styles.card} ${hasHeader ? "" : styles.centered}`}
      href={getCtaHref(action)}
      onClick={() => emitCtaEvent(action)}
    >
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
      <span className={styles.action}>
        {actionLabel}
        <Icon name="arrow-right" size={16} />
      </span>
    </Link>
  );
}
