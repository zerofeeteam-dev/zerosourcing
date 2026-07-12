"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import styles from "./CardCarousel.module.css";

type CardCarouselProps = {
  /**
   * 캐러셀 모드에서 트랙을 컨테이너 밖으로 확장할 폭(px).
   * 보통 섹션의 좌우 여백과 같은 값을 넘긴다. 확장된 만큼
   * 첫/마지막 카드의 바깥 여백으로 재적용되어, 카드가 화면
   * 끝까지 스크롤되면서도 정지 상태에서는 콘텐츠 라인에 맞는다.
   */
  bleed?: number;
  /** 캐러셀 모드에서의 카드 간격(px). 기본 8px. */
  carouselGap?: number;
  children: ReactNode;
  className?: string;
  /** 한 줄 모드에서의 카드 간격(px). 기본 20px. */
  gap?: number;
  /** 카드가 이 폭(px)을 유지할 수 없으면 캐러셀로 전환. 기본 330px. */
  minItemWidth?: number;
  /** 480px 이하 캐러셀 모드에서만 사용할 카드 폭(px). */
  mobileItemWidth?: number;
  /** 캐러셀 모드에서 카드가 멈추는 위치. 기본 start. */
  snapAlign?: "center" | "start";
};

/**
 * 카드 리스트 레이아웃. 컨테이너가 모든 카드를 minItemWidth 이상으로
 * 담을 수 있으면 균등 분할 한 줄로, 부족하면 고정폭 스냅 캐러셀로 전환된다.
 * 카드 자체의 스타일은 children이 가져야 하며, 이 컴포넌트는 배치만 담당한다.
 */
export function CardCarousel({
  bleed = 0,
  carouselGap = 8,
  children,
  className,
  gap = 20,
  minItemWidth = 330,
  mobileItemWidth,
  snapAlign = "start",
}: CardCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"carousel" | "row">("row");

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const update = () => {
      const count = viewport.firstElementChild?.childElementCount ?? 0;
      const required = count * minItemWidth + (count - 1) * gap;
      setMode(viewport.clientWidth < required ? "carousel" : "row");
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [gap, minItemWidth]);

  return (
    <div
      className={className ? `${styles.viewport} ${className}` : styles.viewport}
      data-mode={mode}
      data-snap-align={snapAlign}
      ref={viewportRef}
      style={
        {
          "--carousel-bleed": `${bleed}px`,
          "--carousel-gap": `${gap}px`,
          "--carousel-gap-narrow": `${carouselGap}px`,
          "--carousel-item-width": `${minItemWidth}px`,
          "--carousel-item-width-mobile": `${mobileItemWidth ?? minItemWidth}px`,
        } as CSSProperties
      }
    >
      <div className={styles.track}>{children}</div>
    </div>
  );
}
