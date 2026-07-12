"use client";

import {
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
  useId,
} from "react";

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  label?: ReactNode;
}

const wrapStyle: CSSProperties = {
  width: 350,
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontFamily: "var(--font-sans)",
  cursor: "pointer",
};

const hiddenInputStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  border: 0,
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  overflow: "hidden",
  whiteSpace: "nowrap",
};

const iconStyle: CSSProperties = {
  width: 24,
  height: 24,
  flex: "0 0 auto",
};

const labelTextStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#1b1f2a",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "21px",
  letterSpacing: "-0.21px",
};

const radioCss = `
.zs-radio__input:not(:checked):not(:disabled) ~ .zs-radio__icon {
  color: var(--color-gray-400);
  opacity: 1;
}

.zs-radio__input:checked:not(:disabled) ~ .zs-radio__icon {
  color: var(--color-brand-500);
  opacity: 1;
}

.zs-radio__input:checked:not(:disabled) ~ .zs-radio__text {
  opacity: 1;
}

.zs-radio__input:disabled ~ .zs-radio__icon {
  color: var(--color-gray-400);
  opacity: 1;
}

.zs-radio__input:disabled ~ .zs-radio__text {
  color: #d1d7e2;
  opacity: 1;
}
`;

function RadioIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      "aria-label": ariaLabel,
      className,
      disabled,
      id,
      label,
      style,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;

    return (
      <label
        className={["zs-radio", className].filter(Boolean).join(" ")}
        htmlFor={radioId}
        style={{
          ...wrapStyle,
          cursor: disabled ? "not-allowed" : wrapStyle.cursor,
          ...style,
        }}
      >
        <style>{radioCss}</style>
        <input
          {...props}
          aria-label={label ? ariaLabel : (ariaLabel ?? "선택")}
          className="zs-radio__input"
          disabled={disabled}
          id={radioId}
          ref={ref}
          style={hiddenInputStyle}
          type="radio"
        />
        <span className="zs-radio__icon" style={iconStyle}>
          <RadioIcon />
        </span>
        {label ? (
          <span className="zs-radio__text" style={labelTextStyle}>
            {label}
          </span>
        ) : null}
      </label>
    );
  },
);

Radio.displayName = "Radio";
