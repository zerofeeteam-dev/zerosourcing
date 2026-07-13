"use client";

import { useLayoutEffect, useRef } from "react";

import { Icon } from "../../components/Icon";
import {
  ensureGlassFilter,
  supportsGlassRefraction,
} from "../../components/glassFilter";
import styles from "./page.module.css";

type Option = "1" | "2" | "3";

export function LiquidGlassSwitcher() {
  const switcherRef = useRef<HTMLFieldSetElement | null>(null);

  useLayoutEffect(() => {
    const element = switcherRef.current;
    if (!element) return;

    let currentOption: Option = "1";
    const handleChange = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.checked) return;

      const nextOption = input.dataset.option as Option | undefined;
      if (!nextOption) return;

      element.dataset.previous = currentOption;
      currentOption = nextOption;
    };

    element.addEventListener("change", handleChange);

    if (supportsGlassRefraction()) {
      const filterId = ensureGlassFilter({
        width: 244,
        height: 70,
        radius: 35,
        bezel: 18,
        scale: 54,
      });
      const filter = `blur(8px) url("#${filterId}") saturate(var(--saturation))`;
      element.style.backdropFilter = filter;
    }

    return () => element.removeEventListener("change", handleChange);
  }, []);

  return (
    <fieldset
      className={styles.switcher}
      data-previous="1"
      ref={switcherRef}
    >
      <legend className={styles.visuallyHidden}>Choose theme</legend>

      <label className={styles.option}>
        <input
          aria-label="Light theme"
          className={styles.input}
          data-option="1"
          defaultChecked
          name="liquid-glass-theme"
          type="radio"
          value="light"
        />
        <span className={styles.iconFrame}>
          <Icon name="theme-light" size={36} />
        </span>
      </label>

      <label className={styles.option}>
        <input
          aria-label="Dark theme"
          className={styles.input}
          data-option="2"
          name="liquid-glass-theme"
          type="radio"
          value="dark"
        />
        <span className={styles.iconFrame}>
          <Icon name="theme-dark" size={36} />
        </span>
      </label>

      <label className={styles.option}>
        <input
          aria-label="Dim theme"
          className={styles.input}
          data-option="3"
          name="liquid-glass-theme"
          type="radio"
          value="dim"
        />
        <span className={styles.iconFrame}>
          <Icon name="theme-dim" size={36} />
        </span>
      </label>

      <span aria-hidden="true" className={styles.toggle} />
    </fieldset>
  );
}
