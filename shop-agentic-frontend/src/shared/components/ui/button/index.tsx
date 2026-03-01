import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./index.module.scss";

type ButtonVariant = "primary" | "secondary" | "outline" | "text" | "fab";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  /** Icon-only button: square shape, no border, surface-soft (#f8fafc) hover */
  iconOnly?: boolean;
}

function Button({
  children,
  variant = "primary",
  className,
  fullWidth = false,
  iconOnly = false,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      className={[
        styles.button,
        styles[variant],
        fullWidth ? styles.full : "",
        iconOnly ? styles["icon-only"] : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default Button;
