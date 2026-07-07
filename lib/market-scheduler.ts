function getNewYorkParts(date: Date): { weekday: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const weekday = weekdayMap[parts.find((p) => p.type === "weekday")!.value];
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const minute = Number(parts.find((p) => p.type === "minute")!.value);

  return { weekday, hour, minute };
}

/** Lun–vie 9:30–16:00 America/New_York (sin feriados NYSE en v1). */
export function isMarketOpen(moment = new Date()): boolean {
  const { weekday, hour, minute } = getNewYorkParts(moment);
  if (weekday === 0 || weekday === 6) return false;
  const totalMinutes = hour * 60 + minute;
  const open = 9 * 60 + 30;
  const close = 16 * 60;
  return totalMinutes >= open && totalMinutes < close;
}
