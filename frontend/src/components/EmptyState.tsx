import { Button } from "./Button";

interface EmptyStateProps {
  onCreate: () => void;
}

export function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="card empty-state">
      <h2 className="empty-state__title">Aún no tienes alertas</h2>
      <p className="empty-state__text">
        Crea tu primera alerta con un preset técnico. Te avisaremos por correo cuando se cumpla la
        condición en velas de 15 minutos.
      </p>
      <Button onClick={onCreate}>Nueva alerta</Button>
    </div>
  );
}
