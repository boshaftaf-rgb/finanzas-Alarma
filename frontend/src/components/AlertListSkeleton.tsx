interface AlertListSkeletonProps {
  rows?: number;
}

export function AlertListSkeleton({ rows = 4 }: AlertListSkeletonProps) {
  return (
    <div className="alert-list" aria-busy="true" aria-label="Cargando alertas">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row" aria-hidden="true">
          <div className="skeleton skeleton-row__ticker" />
          <div className="skeleton skeleton-row__label" />
          <div className="skeleton skeleton-row__badge" />
          <div className="skeleton skeleton-row__action" />
          <div className="skeleton skeleton-row__action" />
        </div>
      ))}
    </div>
  );
}
