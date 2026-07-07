import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isPrimary = variant === "primary";

  if (isPrimary) {
    return (
      <button
        type="button"
        className={`btn-primary ${loading ? "is-loading" : ""} ${className}`.trim()}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        <span className="btn-primary__label">{children}</span>
        <span className="btn-primary__loader" aria-hidden="true" />
      </button>
    );
  }

  const variantClass =
    variant === "secondary" ? "btn-secondary" : variant === "danger" ? "btn-danger" : "btn-ghost";

  return (
    <button
      type="button"
      className={`${variantClass} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {children}
    </button>
  );
}
