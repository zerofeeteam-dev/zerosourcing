"use client";

import type { CSSProperties } from "react";
import { Button } from "@repo/ui/button";

import { Icon } from "./Icon";
import { emitCtaClick } from "./cta-events";

const ctaButtonStyle = {
  borderRadius: 32,
  padding: "8px 20px",
  width: 200,
} satisfies CSSProperties;

export function QuickConsultCtaButton() {
  return (
    <Button
      color="yellow"
      iconSize={24}
      leftIcon={<Icon name="message-typing" size={24} />}
      onClick={() => emitCtaClick("quick")}
      style={ctaButtonStyle}
      variant="gradient"
    >
      무료 상담 신청하기
    </Button>
  );
}
