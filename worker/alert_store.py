"""Persistencia de alertas vía Supabase service_role."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from supabase import Client, create_client


class AlertStore:
    """Lee alertas activas y actualiza estado de evaluación."""

    def __init__(self, supabase_url: str, service_role_key: str) -> None:
        self._client: Client = create_client(supabase_url, service_role_key)

    def fetch_active_alerts(self) -> list[dict[str, Any]]:
        response = (
            self._client.table("alerts")
            .select("*")
            .eq("active", True)
            .order("ticker")
            .execute()
        )
        return response.data or []

    def update_last_evaluated(self, alert_id: str, evaluated_at: datetime | None = None) -> None:
        timestamp = evaluated_at or datetime.now(timezone.utc)
        iso_value = timestamp.isoformat()
        self._client.table("alerts").update(
            {"last_evaluated_at": iso_value}
        ).eq("id", alert_id).execute()
