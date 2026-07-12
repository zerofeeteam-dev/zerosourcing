import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./AdminButton.module.css";

export type AdminButtonSize = "sm" | "md" | "figma";
export type AdminButtonVariant = "danger" | "ghost" | "primary" | "secondary";

type NativeButtonType = "button" | "reset" | "submit";

type AdminButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly iconPosition?: "left" | "right";
  readonly size?: AdminButtonSize;
  readonly type?: NativeButtonType;
  readonly variant?: AdminButtonVariant;
};

type AdminIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  readonly ariaLabel: string;
  readonly icon: ReactNode;
  readonly size?: AdminButtonSize;
  readonly type?: NativeButtonType;
  readonly variant?: AdminButtonVariant;
};

function classNames(...values: readonly (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export function AdminButton({
  children,
  className,
  icon,
  iconPosition = "left",
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: AdminButtonProps) {
  const iconElement = icon ? (
    <span aria-hidden="true" className={styles.icon}>
      {icon}
    </span>
  ) : null;

  return (
    <button
      {...props}
      className={classNames(
        styles.button,
        styles[size],
        styles[variant],
        className,
      )}
      type={type}
    >
      {iconPosition === "left" ? iconElement : null}
      <span>{children}</span>
      {iconPosition === "right" ? iconElement : null}
    </button>
  );
}

export function AdminIconButton({
  ariaLabel,
  className,
  icon,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: AdminIconButtonProps) {
  return (
    <button
      {...props}
      aria-label={ariaLabel}
      className={classNames(
        styles.button,
        styles.iconOnly,
        styles[size],
        styles[variant],
        className,
      )}
      type={type}
    >
      <span aria-hidden="true" className={styles.icon}>
        {icon}
      </span>
    </button>
  );
}
