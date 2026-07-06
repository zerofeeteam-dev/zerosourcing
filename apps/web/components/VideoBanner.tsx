"use client";

import type { CSSProperties, ReactNode } from "react";
import { Button, type ButtonColor } from "@repo/ui/button";

import { Icon } from "./Icon";
import { type CtaAction, emitCtaClick } from "./cta-events";
import styles from "./VideoBanner.module.css";

type BannerActionIcon = "edit-03" | "message-typing";
type BannerAlign = "center" | "left";
type BannerActionsPosition = "below" | "bottom";

type BannerAction = {
  id: CtaAction;
  title: string;
  icon?: BannerActionIcon;
  variant?: ButtonColor;
};

type VideoBannerProps = {
  actions?: BannerAction[];
  actionsPosition?: BannerActionsPosition;
  align?: BannerAlign;
  description?: string;
  eyebrow?: string;
  title: ReactNode;
};

const bannerVideoSrc = "/banner_video.mp4";
const actionButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
} satisfies CSSProperties;

export function VideoBanner({
  actions = [],
  actionsPosition = "below",
  align = "center",
  description,
  eyebrow,
  title,
}: VideoBannerProps) {
  return (
    <section className={styles.banner} data-node-id="292:74456">
      <video
        aria-hidden="true"
        autoPlay
        className={styles.video}
        loop
        muted
        playsInline
        src={bannerVideoSrc}
      />
      <div
        className={`${styles.content} ${styles[align]} ${styles[`content-${actionsPosition}`]}`}
      >
        <div className={styles.copy}>
          {eyebrow ? (
            <div
              className={`${styles.eyebrowChip} glassSurface glassSurfacePill`}
            >
              <p className={styles.eyebrow}>{eyebrow}</p>
            </div>
          ) : null}
          <div className={styles.text}>
            <h1 className={styles.title}>{title}</h1>
            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
          </div>
        </div>
        {actions.length > 0 ? (
          <div className={styles.actions}>
            {actions.map((action) => (
              <Button
                color={action.variant ?? "blue"}
                iconSize={24}
                key={action.id}
                leftIcon={
                  action.icon ? <Icon name={action.icon} size={24} /> : null
                }
                onClick={() => emitCtaClick(action.id)}
                style={actionButtonStyle}
                variant="gradient"
              >
                {action.title}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
