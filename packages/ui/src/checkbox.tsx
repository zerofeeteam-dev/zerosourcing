"use client";

import {
  type CSSProperties,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
  useId,
  useState,
} from "react";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  actionLabel?: string;
  label?: ReactNode;
  onActionClick?: () => void;
}

const wrapStyle: CSSProperties = {
  width: 350,
  height: 40,
  padding: "8px 0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  fontFamily: "var(--font-sans)",
};

const labelWrapStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 auto",
  display: "flex",
  alignItems: "center",
  gap: 8,
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

const iconBoxStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const labelTextStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "21px",
  letterSpacing: "-0.21px",
};

const actionTextStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#3f4759",
  fontFamily: "var(--font-sans)",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: "18px",
  letterSpacing: "-0.18px",
  textDecoration: "underline",
  textUnderlinePosition: "from-font",
};

function CheckboxIcon({ fill }: { fill: string }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill={fill} height="24" rx="8" width="24" />
      <path
        d="M16 9L10.0337 15L8 12.9548"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      actionLabel,
      checked,
      className,
      defaultChecked = false,
      disabled,
      id,
      label,
      onActionClick,
      onChange,
      style,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const isChecked = isControlled ? checked : internalChecked;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalChecked(event.target.checked);
      onChange?.(event);
    };

    const iconFill = disabled
      ? "var(--color-gray-200)"
      : isChecked
        ? "var(--color-brand-500)"
        : "var(--color-gray-400)";

    return (
      <div className={className} style={{ ...wrapStyle, ...style }}>
        <label
          htmlFor={checkboxId}
          style={{
            ...labelWrapStyle,
            cursor: disabled ? "not-allowed" : labelWrapStyle.cursor,
          }}
        >
          <input
            {...props}
            checked={checked}
            defaultChecked={isControlled ? undefined : defaultChecked}
            disabled={disabled}
            id={checkboxId}
            onChange={handleChange}
            ref={ref}
            style={hiddenInputStyle}
            type="checkbox"
          />
          <span style={iconBoxStyle}>
            <CheckboxIcon fill={iconFill} />
          </span>
          {label ? (
            <span
              style={{
                ...labelTextStyle,
                color: disabled ? "var(--color-gray-200)" : "var(--color-gray-800)",
              }}
            >
              {label}
            </span>
          ) : null}
        </label>
        {actionLabel ? (
          onActionClick ? (
            <button
              onClick={onActionClick}
              style={{ ...actionTextStyle, cursor: "pointer" }}
              type="button"
            >
              {actionLabel}
            </button>
          ) : (
            <span style={actionTextStyle}>{actionLabel}</span>
          )
        ) : null}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
