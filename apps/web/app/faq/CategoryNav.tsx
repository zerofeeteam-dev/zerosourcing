"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Icon, type IconName } from "../../components/Icon";
import styles from "./page.module.css";

export type FaqCategoryNavItem = {
  icon: IconName;
  id: string;
  title: string;
};

export type FaqCategoryNavGroup = {
  items: readonly FaqCategoryNavItem[];
  title: string;
};

type CategoryNavProps = {
  groups: readonly FaqCategoryNavGroup[];
};

export function CategoryNav({ groups }: CategoryNavProps) {
  const ids = useMemo(
    () => groups.flatMap((group) => group.items.map((item) => item.id)),
    [groups],
  );
  const [activeId, setActiveId] = useState(ids[0] ?? "");
  const pendingIdRef = useRef<string | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const readActiveSection = () => {
      const anchorY = Math.min(window.innerHeight * 0.4, 260);
      let fallbackId = ids[0] ?? "";
      let fallbackDistance = Number.POSITIVE_INFINITY;

      for (const id of ids) {
        const element = document.getElementById(id);

        if (!element) {
          continue;
        }

        const rect = element.getBoundingClientRect();

        if (rect.top <= anchorY && rect.bottom > anchorY) {
          setActiveId(id);
          return;
        }

        const visibleHeight =
          Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

        if (visibleHeight > 0) {
          const distance = Math.abs(rect.top - anchorY);

          if (distance < fallbackDistance) {
            fallbackId = id;
            fallbackDistance = distance;
          }
        }
      }

      setActiveId(fallbackId);
    };

    const releasePendingAfterIdle = () => {
      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(() => {
        pendingIdRef.current = null;
        readActiveSection();
      }, 140);
    };

    const handleScroll = () => {
      if (pendingIdRef.current) {
        releasePendingAfterIdle();
        return;
      }

      readActiveSection();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", readActiveSection);
    readActiveSection();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", readActiveSection);
      clearIdleTimer();
    };
  }, [ids]);

  const handleNavClick = (id: string) => {
    pendingIdRef.current = id;
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <aside className={styles.sidebar} aria-label="FAQ 카테고리">
      <div className={styles.navPanel}>
        {groups.map((group) => (
          <div className={styles.navGroup} key={group.title}>
            <p className={styles.navGroupTitle}>{group.title}</p>
            <div className={styles.navList}>
              {group.items.map((item) => {
                const isActive = activeId === item.id;

                return (
                  <button
                    aria-current={isActive ? "true" : undefined}
                    className={isActive ? styles.navItemActive : styles.navItem}
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    type="button"
                  >
                    <Icon name={item.icon} size={16} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
