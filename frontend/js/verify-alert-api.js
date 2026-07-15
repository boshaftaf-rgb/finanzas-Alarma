export async function verifyAlert(alertId) {
  const response = await fetch("/api/verify-alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      (typeof body.error === "string" && body.error) ||
      `Error ${response.status} al verificar la alerta`;
    throw new Error(msg);
  }
  return body;
}
