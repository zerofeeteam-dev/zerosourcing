"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  forwardRef,
} from "react";

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  onValueChange?: (value: string) => void;
}

const wrapStyle: CSSProperties = {
  width: 350,
  height: 52,
  padding: "0 16px",
  border: "1px solid #e9ecf2",
  borderRadius: 16,
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  gap: 16,
  fontFamily: "var(--font-sans)",
};

const inputStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 auto",
  border: 0,
  outline: "none",
  background: "transparent",
  color: "#1b1f2a",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "21px",
  letterSpacing: "-0.21px",
};

const iconStyle: CSSProperties = {
  flex: "0 0 auto",
  color: "#1b1f2a",
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      style={iconStyle}
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.9284 17.0416L20.4016 20.4016M11.4016 7.20156C13.3898 7.20156 15.0016 8.81334 15.0016 10.8016M19.2816 11.4416C19.2816 15.7715 15.7715 19.2816 11.4416 19.2816C7.11165 19.2816 3.60156 15.7715 3.60156 11.4416C3.60156 7.11165 7.11165 3.60156 11.4416 3.60156C15.7715 3.60156 19.2816 7.11165 19.2816 11.4416Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      disabled,
      onChange,
      onValueChange,
      placeholder = "검색어를 입력해주세요.",
      style,
      ...props
    },
    ref,
  ) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(event.target.value);
      onChange?.(event);
    };

    return (
      <div
        className={className}
        style={{
          ...wrapStyle,
          opacity: disabled ? 0.4 : undefined,
          ...style,
        }}
      >
        <input
          {...props}
          disabled={disabled}
          onChange={handleChange}
          placeholder={placeholder}
          ref={ref}
          style={inputStyle}
          type="search"
        />
        <SearchIcon />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
