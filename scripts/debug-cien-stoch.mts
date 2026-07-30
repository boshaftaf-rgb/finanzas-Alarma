import { appendFileSync, readFileSync } from "node:fs";
import { computeStochastic } from "../lib/indicator-engine.js";
import { fetchBatchOhlcv } from "../lib/twelve-data-fetcher.js";
import { evaluateAlert } from "../lib/alert-evaluator.js";
import { formatCandleForEmail } from "../lib/alert-email-template.js";

const LOG = "debug-af6ab3.log";

function loadEnv(): Record<string, string> {
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

function log(message: string, hypothesisId: string, data: unknown) {
  const payload = {
    sessionId: "af6ab3",
    hypothesisId,
    location: "scripts/debug-cien-stoch.mts",
    message,
    data,
    timestamp: Date.now(),
    runId: "post-fix",
  };
  appendFileSync(LOG, `${JSON.stringify(payload)}\n`);
  console.log(message, JSON.stringify(data, null, 2));
}

const env = loadEnv();
const apiKey = env.TWELVE_DATA_API_KEY;
if (!apiKey) throw new Error("TWELVE_DATA_API_KEY missing");

const map = await fetchBatchOhlcv(["CIEN"], apiKey, { interval: "1day", outputsize: 40 });
const bars = map.get("CIEN");
if (!bars?.length) throw new Error("no CIEN bars");

const stoch = computeStochastic(
  bars.map((b) => b.high),
  bars.map((b) => b.low),
  bars.map((b) => b.close),
  7,
);

const recent = bars.slice(-20).map((b, idx) => {
  const i = bars.length - 20 + idx;
  return {
    rawDatetime: b.datetime,
    emailLabelEt: formatCandleForEmail(b.datetime, "1day"),
    o: b.open,
    h: b.high,
    l: b.low,
    c: b.close,
    stoch7: Number.isFinite(stoch[i]) ? Number(stoch[i].toFixed(2)) : null,
    below20: stoch[i] < 20,
  };
});

const evalResult = evaluateAlert(
  { ticker: "CIEN", preset_or_custom: "stoch_oversold", params: { period: 7, threshold: 20 } },
  bars,
);

// Hyp A: Fast %K actually < 20 on 27-28 Jul
const julTarget = recent.filter((r) => {
  const d = r.emailLabelEt;
  return d.includes("27") || d.includes("28") || d.includes("29") || d.includes("30");
});

log("CIEN Stoch recent bars + email labels", "A", {
  barsCount: bars.length,
  firstRaw: bars[0]?.datetime,
  lastRaw: bars.at(-1)?.datetime,
  recent,
  julFocus: julTarget,
});

log("evaluateAlert stoch_oversold on latest series", "B", {
  evalResult,
  lastStoch: recent.at(-1),
});

// Hyp C: timezone shift — compare UTC date vs ET label
const tzRows = bars.slice(-10).map((b) => {
  const utc = new Date(b.datetime);
  return {
    raw: b.datetime,
    utcDate: utc.toISOString().slice(0, 10),
    etLabel: formatCandleForEmail(b.datetime, "1day"),
    etHour: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(utc),
  };
});
log("timezone raw vs ET label", "C", { tzRows });
