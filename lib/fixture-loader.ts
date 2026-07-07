import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { OhlcvBar } from "./types.js";

export function loadFixture(ticker: string, fixturesDir: string): OhlcvBar[] {
  const path = join(fixturesDir, `${ticker.toUpperCase()}.json`);
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as OhlcvBar[];
}
