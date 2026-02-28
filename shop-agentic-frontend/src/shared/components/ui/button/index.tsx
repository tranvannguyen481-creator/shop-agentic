import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./index.module.scss";

type ButtonVariant = "primary" | "secondary" | "outline" | "text" | "fab";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

function Button({
  children,
  variant = "primary",
  className,
  fullWidth = false,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${
        fullWidth ? styles.full : ""
      } ${className ?? ""}`.trim()}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default Button;
