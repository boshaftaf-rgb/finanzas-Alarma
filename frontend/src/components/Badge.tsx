interface BadgeProps {
  variant: "active" | "inactive" | "ema" | "rsi";
  children: string;
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}
