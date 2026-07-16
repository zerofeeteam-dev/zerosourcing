"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Button, type ButtonColor } from "@repo/ui/button";

import { BannerEyebrowChip } from "./BannerEyebrowChip";
import { Icon } from "./Icon";
import { type CtaAction, emitCtaClick } from "./cta-events";
import styles from "./VideoBanner.module.css";

type BannerActionIcon =
  | "arrow-right"
  | "arrow-right-banner"
  | "edit-03"
  | "message-typing";
type BannerAlign = "center" | "left";
type BannerActionsPosition = "below" | "bottom";
type BannerActionIconPosition = "left" | "right";

type BannerAction = {
  id: CtaAction;
  title: string;
  icon?: BannerActionIcon;
  iconPosition?: BannerActionIconPosition;
  variant?: ButtonColor;
  width?: number;
};

type VideoBannerProps = {
  actions?: BannerAction[];
  actionsPosition?: BannerActionsPosition;
  align?: BannerAlign;
  description?: ReactNode;
  descriptionMaxWidth?: number;
  eyebrow?: string;
  title: ReactNode;
};

const bannerVideoSrc = "/banner_video.mp4";
const bannerVideoMobileSrc = "/banner_video_mobile.mp4";
const bannerPosterSrc = "/banner-poster.webp";
const actionButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
} satisfies CSSProperties;

export function VideoBanner({
  actions = [],
  actionsPosition = "below",
  align = "center",
  description,
  descriptionMaxWidth,
  eyebrow,
  title,
}: VideoBannerProps) {
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const events = ["keydown", "pointermove", "scroll", "touchstart"] as const;
    const removeListeners = () => {
      events.forEach((event) => window.removeEventListener(event, startVideo));
    };
    const startVideo = () => {
      removeListeners();
      setShouldPlayVideo(true);
    };

    events.forEach((event) =>
      window.addEventListener(event, startVideo, { once: true, passive: true }),
    );

    return removeListeners;
  }, []);

  return (
    <section className={styles.banner} data-node-id="292:74456">
      {shouldPlayVideo ? (
        <video
          aria-hidden="true"
          autoPlay
          className={styles.video}
          loop
          muted
          playsInline
          poster={bannerPosterSrc}
          preload="metadata"
        >
          <source
            media="(max-width: 768px)"
            src={bannerVideoMobileSrc}
            type="video/mp4"
          />
          <source src={bannerVideoSrc} type="video/mp4" />
        </video>
      ) : null}
      <div
        className={`${styles.content} ${styles[align]} ${styles[`content-${actionsPosition}`]}`}
      >
        <div className={styles.copy}>
          {eyebrow ? <BannerEyebrowChip>{eyebrow}</BannerEyebrowChip> : null}
          <div className={styles.text}>
            <h1 className={styles.title}>{title}</h1>
            {description ? (
              <p
                className={styles.description}
                style={
                  descriptionMaxWidth
                    ? { maxWidth: descriptionMaxWidth }
                    : undefined
                }
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions.length > 0 ? (
          <div className={styles.actions}>
            {actions.map((action) => {
              const icon = action.icon ? (
                <Icon name={action.icon} size={24} />
              ) : null;

              return (
                <Button
                  color={action.variant ?? "blue"}
                  iconSize={24}
                  key={action.id}
                  leftIcon={action.iconPosition === "right" ? null : icon}
                  onClick={() => emitCtaClick(action.id)}
                  rightIcon={action.iconPosition === "right" ? icon : null}
                  style={
                    action.width
                      ? { ...actionButtonStyle, width: action.width }
                      : actionButtonStyle
                  }
                  variant="gradient"
                >
                  {action.title}
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
