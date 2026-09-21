#!/usr/bin/env node
/**
 * Validates the current week's picks spreadsheet before the app starts.
 * Flags rows where a team code isn't recognized, or a player's pick doesn't
 * match either team actually playing in that game (the classic typo shape:
 * "BART" for "BALT", "BUFF" for "BUF", etc). A late pick, recorded as the
 * LATE_PICK marker from constants.ts, is allowed on any game.
 */
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import {
  CURRENT_WEEK,
  PLAYERS,
  LATE_PICK,
  RICK_TO_ESPN_MAP,
} from "../src/utils/constants";

export const ROOT = path.join(__dirname, "..");

const PLAYER_SET = new Set<string>(PLAYERS);
const TEAM_CODES = new Set<string>(RICK_TO_ESPN_MAP.keys());

// Levenshtein edit distance between two strings.
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1, // deletion
        dist[i][j - 1] + 1, // insertion
        dist[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dist[rows - 1][cols - 1];
}

// Finds the closest string to `target` among `candidates`, formatted as a "did you mean" suffix.
export function didYouMean(target: string, candidates: Iterable<string>): string {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = editDistance(target, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  if (best === null) return "";
  return ` Did you mean "${best}"?`;
}

export function findSpreadsheet(weekNum: number): string {
  const filePath = path.join(ROOT, "public/spreadsheets", `Week ${weekNum};.xlsx`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Spreadsheet not found for week ${weekNum}: ${filePath}`);
  }
  return filePath;
}

export type SpreadsheetRow = { [key: string]: string | number | undefined };

export function readSpreadsheet(filePath: string): SpreadsheetRow[] {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<SpreadsheetRow>(worksheet, { blankrows: false });
}

// The "WK <n>" column the app reads picks from, if the sheet has one.
export function findWeekKey(rows: SpreadsheetRow[]): string | undefined {
  const keys = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
  return [...keys].find((key) => /^WK \d+$/.test(key));
}

export function checkSpreadsheet(filePath: string): string[] {
  const data = readSpreadsheet(filePath);
  const weekKey = findWeekKey(data);
  const issues: string[] = [];

  if (!weekKey) {
    issues.push("Could not find a 'WK <n>' column in the spreadsheet.");
    return issues;
  }

  const headerKeys = new Set<string>();
  data.forEach((row) => Object.keys(row).forEach((key) => headerKeys.add(key)));
  headerKeys.delete(weekKey);
  for (const header of headerKeys) {
    if (!PLAYER_SET.has(header)) {
      issues.push(`Unrecognized player column "${header}".${didYouMean(header, PLAYER_SET)}`);
    }
  }

  for (let i = 0; i < data.length - 1; i += 2) {
    const awayRow = data[i];
    const homeRow = data[i + 1];
    const away = awayRow[weekKey];
    const home = homeRow[weekKey];

    if (typeof away !== "string" || typeof home !== "string") continue;

    const gameLabel = `${away} @ ${home}`;
    if (!TEAM_CODES.has(away)) {
      issues.push(
        `Row ${i + 2}: away team code "${away}" (${gameLabel}) is not a recognized team code.${didYouMean(away, TEAM_CODES)}`
      );
    }
    if (!TEAM_CODES.has(home)) {
      issues.push(
        `Row ${i + 3}: home team code "${home}" (${gameLabel}) is not a recognized team code.${didYouMean(home, TEAM_CODES)}`
      );
    }

    for (const key in homeRow) {
      if (key === weekKey || !PLAYER_SET.has(key)) continue;
      const value = homeRow[key];
      if (typeof value !== "string") continue;
      const pick = value.toUpperCase().trim();
      // A late pick counts as wrong no matter who wins, so it's valid anywhere.
      if (pick !== away && pick !== home && pick !== LATE_PICK) {
        // Suggestions must only ever come from the master team code list —
        // away/home could themselves be typos, so they're not safe candidates.
        const reason = TEAM_CODES.has(pick)
          ? `is not one of the teams in this matchup (${gameLabel}).`
          : `is not a recognized team code.${didYouMean(pick, TEAM_CODES)}`;
        issues.push(`Row ${i + 3}: ${key}'s pick "${value}" ${reason}`);
      }
    }
  }

  return issues;
}

function main(): void {
  const filePath = findSpreadsheet(CURRENT_WEEK);
  const issues = checkSpreadsheet(filePath);

  if (issues.length > 0) {
    console.error(`\nFound ${issues.length} issue(s) in "${path.basename(filePath)}":\n`);
    issues.forEach((issue) => console.error(`  - ${issue}`));
    console.error("\nFix the spreadsheet before starting the app.\n");
    process.exit(1);
  }

  process.stdout.write(`Spreadsheet check passed: "${path.basename(filePath)}" has no typos.\n`);
}

// Run as a CLI, or lend the helpers to scripts/advance-week.ts.
if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`Spreadsheet check failed: ${(err as Error).message}`);
    process.exit(1);
  }
}
