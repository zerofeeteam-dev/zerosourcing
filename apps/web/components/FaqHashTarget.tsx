"use client";

import { useEffect } from "react";

function revealHashTarget() {
  const id = decodeURIComponent(window.location.hash.slice(1));

  if (!id) {
    return;
  }

  const target = document.getElementById(id);

  if (!(target instanceof HTMLDetailsElement)) {
    return;
  }

  target.open = true;
  window.requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start" });
  });
}

export function FaqHashTarget() {
  useEffect(() => {
    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);

    return () => {
      window.removeEventListener("hashchange", revealHashTarget);
    };
  }, []);

  return null;
}
