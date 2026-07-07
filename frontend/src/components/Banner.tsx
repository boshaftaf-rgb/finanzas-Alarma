interface BannerProps {
  variant: "error" | "success";
  message: string;
}

export function Banner({ variant, message }: BannerProps) {
  return (
    <div className={`alert-banner alert-banner--${variant}`} role="alert">
      {message}
    </div>
  );
}
