import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
  forwardRef,
} from "react";

export type ButtonColor = "blue" | "black" | "yellow";
type ButtonSize = "md" | "sm";
type ButtonVariant = "solid" | "outline" | "gradient";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  iconSize?: number;
  size?: ButtonSize;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

type GradientButtonStyle = CSSProperties & {
  "--btn-color-end": string;
  "--btn-color-mid": string;
  "--btn-color-start": string;
};

const baseStyle: CSSProperties = {
  height: 52,
  padding: "8px 16px",
  borderRadius: 16,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: "21px",
  letterSpacing: 0,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const iconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

function getIconStyle(size: number): CSSProperties {
  return {
    ...iconStyle,
    width: size,
    height: size,
  };
}

const sizeStyles = {
  md: {
    height: 52,
  },
  sm: {
    height: 40,
  },
} satisfies Record<ButtonSize, CSSProperties>;

const gradientBackground = `
  linear-gradient(125deg, var(--btn-color-start) 0%, var(--btn-color-mid) 50%, var(--btn-color-end) 100%),
  linear-gradient(150deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.1) 30%),
  linear-gradient(340deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 30%),
  linear-gradient(125deg, var(--btn-color-start) 0%, var(--btn-color-mid) 50%, var(--btn-color-end) 100%)
`;

const gradientBaseStyle: CSSProperties = {
  backgroundClip: "padding-box, border-box, border-box, border-box",
  backgroundImage: gradientBackground,
  backgroundOrigin: "border-box",
  border: "1px solid transparent",
  boxSizing: "border-box",
};

const gradientColorStyles = {
  blue: {
    "--btn-color-start": "#3d82f5",
    "--btn-color-mid": "#3d82f5",
    "--btn-color-end": "#0360ef",
    color: "#fefefe",
  },
  black: {
    "--btn-color-start": "#2a2d3e",
    "--btn-color-mid": "#2a2d3e",
    "--btn-color-end": "#2a2d3e",
    color: "#fefefe",
  },
  yellow: {
    "--btn-color-start": "#fae100",
    "--btn-color-mid": "#fae100",
    "--btn-color-end": "#fac800",
    color: "#3b1d1d",
  },
} satisfies Record<ButtonColor, GradientButtonStyle>;

const variantStyles = {
  solid: {
    color: "#f8faff",
    background: "#0360ef",
    border: "1px solid #0360ef",
  },
  outline: {
    color: "#0360ef",
    background: "#ffffff",
    border: "1px solid #0360ef",
  },
} satisfies Record<Exclude<ButtonVariant, "gradient">, CSSProperties>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      color = "blue",
      disabled,
      iconSize = 16,
      leftIcon,
      rightIcon,
      size = "md",
      style,
      type = "button",
      variant = "solid",
      ...props
    },
    ref,
  ) => {
    const content = (
      <>
        {leftIcon ? (
          <span style={getIconStyle(iconSize)}>{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon ? (
          <span style={getIconStyle(iconSize)}>{rightIcon}</span>
        ) : null}
      </>
    );
    const buttonStyle: CSSProperties = {
      ...baseStyle,
      ...sizeStyles[size],
      ...(variant === "gradient"
        ? {
            ...gradientBaseStyle,
            ...gradientColorStyles[color],
          }
        : variantStyles[variant]),
      opacity: disabled ? 0.4 : undefined,
      cursor: disabled ? "not-allowed" : baseStyle.cursor,
      ...style,
    };

    return (
      <button
        {...props}
        ref={ref}
        className={className}
        disabled={disabled}
        type={type}
        style={buttonStyle}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";
