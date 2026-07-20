"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BottomCtaBanner } from "../../components/BottomCtaBanner";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { Icon } from "../../components/Icon";
import pageStyles from "../page.module.css";
import { categories, navGroups, type FaqCategoryNavGroup } from "./content";
import styles from "./page.module.css";

type CategoryNavProps = {
  groups: readonly FaqCategoryNavGroup[];
};

function CategoryNav({ groups }: CategoryNavProps) {
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

export default function FaqPage() {
  return (
    <main className={pageStyles.page}>
      <div className={pageStyles.headerLayer}>
        <Header />
      </div>

      <section className={styles.section} data-node-id="74:6574">
        <div className={styles.layout}>
          <CategoryNav groups={navGroups} />

          <div className={styles.content}>
            <div className={styles.hero} data-node-id="74:6634">
              <div className={styles.kicker}>
                <span className={styles.kickerChip}>FAQ</span>
                <p className={styles.kickerLabel}>자주 묻는 질문</p>
              </div>
              <div className={styles.heroCopy}>
                <h1 className={styles.title}>개발 외주, 가장 많이 묻는 질문</h1>
                <p className={styles.description}>
                  외주 개발을 맡기기 전 가장 많이 묻는 것들을 모았습니다.
                  비용·기간부터 개발 방식, 출시 이후까지 궁금한 항목을 펼쳐
                  확인하세요.
                </p>
              </div>
              <div className={styles.heroNotice} data-node-id="74:6630">
                <p className={styles.heroNoticeTitle}>
                  상담과 견적은 언제나 무료입니다.
                </p>
                <p className={styles.heroNoticeDescription}>
                  여기서 답을 못 찾으셨다면, 편하게 문의 주세요. 아이디어만
                  있어도 괜찮습니다.
                </p>
              </div>
            </div>

            <div className={styles.categoryStack}>
              {categories.map((category) => (
                <section
                  className={styles.categorySection}
                  id={category.id}
                  key={category.id}
                >
                  <header className={styles.categoryHeader}>
                    <span className={styles.categoryIcon}>
                      <Icon name={category.icon} size={16} />
                    </span>
                    <div className={styles.categoryText}>
                      <h2 className={styles.categoryTitle}>{category.title}</h2>
                      <p className={styles.categoryDescription}>
                        {category.description}
                      </p>
                    </div>
                  </header>

                  <div className={styles.faqList}>
                    {category.items.map((faq, index) => (
                      <div className={styles.faqRow} key={faq.question}>
                        <details className={styles.faqItem}>
                          <summary className={styles.summary}>
                            <span className={styles.question}>
                              Q. {faq.question}
                            </span>
                            <Icon
                              className={styles.chevron}
                              name="chevron-down"
                              size={20}
                            />
                          </summary>
                          <p className={styles.answer}>A. {faq.answer}</p>
                        </details>
                        {index < category.items.length - 1 ? (
                          <span aria-hidden="true" className={styles.divider} />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <BottomCtaBanner
              actions={[
                {
                  icon: "message-typing",
                  id: "quick",
                  title: "무료 상담 신청하기",
                  variant: "yellow",
                },
              ]}
              className={styles.ctaBanner}
              description="가능성부터 함께 점검해 드릴게요. 상담은 무료입니다."
              eyebrow="MVP / 홈페이지 / 어플리케이션 개발"
              title={
                <>
                  부담은 제로, 출시는 현실로
                  <br />
                  MVP·홈페이지 개발 파트너, 제로소싱
                </>
              }
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
