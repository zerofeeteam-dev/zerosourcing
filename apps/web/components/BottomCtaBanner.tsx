"use client";

import type { CSSProperties, ReactNode } from "react";
import { Button, type ButtonColor } from "@repo/ui/button";

import { BannerEyebrowChip } from "./BannerEyebrowChip";
import { Icon } from "./Icon";
import { type CtaAction, emitCtaClick } from "./cta-events";
import styles from "./BottomCtaBanner.module.css";

type BottomCtaIcon = "edit-03" | "message-typing";

type BottomCtaAction = {
  icon?: BottomCtaIcon;
  id: CtaAction;
  title: string;
  variant?: ButtonColor;
};

type BottomCtaBannerProps = {
  actions: BottomCtaAction[];
  className?: string;
  description?: ReactNode;
  descriptionSize?: "default" | "large";
  eyebrow?: string;
  title: ReactNode;
};

const actionButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
} satisfies CSSProperties;

export function BottomCtaBanner({
  actions,
  className,
  description,
  descriptionSize = "default",
  eyebrow,
  title,
}: BottomCtaBannerProps) {
  return (
    <section
      className={className ? `${styles.banner} ${className}` : styles.banner}
      data-node-id="138:5110"
    >
      <div className={styles.content}>
        <div className={styles.copy}>
          {eyebrow ? (
            <div className={styles.eyebrow}>
              <BannerEyebrowChip>{eyebrow}</BannerEyebrowChip>
            </div>
          ) : null}
          <div className={styles.text}>
            <h2 className={styles.title}>{title}</h2>
            {description ? (
              <p
                className={`${styles.description} ${
                  descriptionSize === "large" ? styles.descriptionLarge : ""
                }`}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className={styles.actions}>
          {actions.map((action) => (
            <Button
              color={action.variant ?? "blue"}
              iconSize={24}
              key={action.id}
              leftIcon={action.icon ? <Icon name={action.icon} size={24} /> : null}
              onClick={() => emitCtaClick(action.id)}
              style={actionButtonStyle}
              variant="gradient"
            >
              {action.title}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
