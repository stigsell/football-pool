#!/usr/bin/env node
/**
 * Validates the current week's picks spreadsheet before the app starts.
 * Flags rows where a team code isn't recognized, or a player's pick doesn't
 * match either team actually playing in that game (the classic typo shape:
 * "BART" for "BALT", "BUFF" for "BUF", etc). A late pick, recorded as the
 * LATE_PICK marker from constants.ts, is allowed on any game.
 */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
const CONSTANTS_PATH = path.join(ROOT, "src/utils/constants.ts");

// Levenshtein edit distance between two strings.
function editDistance(a, b) {
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
function didYouMean(target, candidates) {
  let best = null;
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

function readConstants() {
  const text = fs.readFileSync(CONSTANTS_PATH, "utf8");

  const weekMatch = text.match(/CURRENT_WEEK\s*=\s*(\d+)/);
  if (!weekMatch) {
    throw new Error(`Could not find CURRENT_WEEK in ${CONSTANTS_PATH}`);
  }
  const currentWeek = Number(weekMatch[1]);

  const playersMatch = text.match(/PLAYERS\s*=\s*\[([\s\S]*?)\]/);
  if (!playersMatch) {
    throw new Error(`Could not find PLAYERS in ${CONSTANTS_PATH}`);
  }
  const players = [...playersMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  const entriesMatch = text.match(/RICK_TO_ESPN_ENTRIES\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!entriesMatch) {
    throw new Error(`Could not find RICK_TO_ESPN_ENTRIES in ${CONSTANTS_PATH}`);
  }
  const teamCodes = [...entriesMatch[1].matchAll(/\["([^"]+)",\s*"[^"]+"\]/g)].map((m) => m[1]);

  const latePickMatch = text.match(/LATE_PICK\s*=\s*"([^"]+)"/);
  if (!latePickMatch) {
    throw new Error(`Could not find LATE_PICK in ${CONSTANTS_PATH}`);
  }
  const latePick = latePickMatch[1];

  return { currentWeek, players: new Set(players), teamCodes: new Set(teamCodes), latePick };
}

function findSpreadsheet(weekNum) {
  const filePath = path.join(ROOT, "public/spreadsheets", `Week ${weekNum};.xlsx`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Spreadsheet not found for week ${weekNum}: ${filePath}`);
  }
  return filePath;
}

function checkSpreadsheet(filePath, { players, teamCodes, latePick }) {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { blankrows: false });

  const weekKey = Object.keys(data[0] || {}).find((key) => /^WK \d+$/.test(key));
  const issues = [];

  if (!weekKey) {
    issues.push("Could not find a 'WK <n>' column in the spreadsheet.");
    return issues;
  }

  const headerKeys = new Set();
  data.forEach((row) => Object.keys(row).forEach((key) => headerKeys.add(key)));
  headerKeys.delete(weekKey);
  for (const header of headerKeys) {
    if (!players.has(header)) {
      issues.push(`Unrecognized player column "${header}".${didYouMean(header, players)}`);
    }
  }

  for (let i = 0; i < data.length - 1; i += 2) {
    const awayRow = data[i];
    const homeRow = data[i + 1];
    const away = awayRow[weekKey];
    const home = homeRow[weekKey];

    if (typeof away !== "string" || typeof home !== "string") continue;

    const gameLabel = `${away} @ ${home}`;
    if (!teamCodes.has(away)) {
      issues.push(
        `Row ${i + 2}: away team code "${away}" (${gameLabel}) is not a recognized team code.${didYouMean(away, teamCodes)}`
      );
    }
    if (!teamCodes.has(home)) {
      issues.push(
        `Row ${i + 3}: home team code "${home}" (${gameLabel}) is not a recognized team code.${didYouMean(home, teamCodes)}`
      );
    }

    for (const key in homeRow) {
      if (key === weekKey || !players.has(key)) continue;
      const value = homeRow[key];
      if (typeof value !== "string") continue;
      const pick = value.toUpperCase().trim();
      // A late pick counts as wrong no matter who wins, so it's valid anywhere.
      if (pick !== away && pick !== home && pick !== latePick) {
        // Suggestions must only ever come from the master team code list —
        // away/home could themselves be typos, so they're not safe candidates.
        const reason = teamCodes.has(pick)
          ? `is not one of the teams in this matchup (${gameLabel}).`
          : `is not a recognized team code.${didYouMean(pick, teamCodes)}`;
        issues.push(`Row ${i + 3}: ${key}'s pick "${value}" ${reason}`);
      }
    }
  }

  return issues;
}

function main() {
  const { currentWeek, players, teamCodes, latePick } = readConstants();
  const filePath = findSpreadsheet(currentWeek);
  const issues = checkSpreadsheet(filePath, { players, teamCodes, latePick });

  if (issues.length > 0) {
    console.error(`\nFound ${issues.length} issue(s) in "${path.basename(filePath)}":\n`);
    issues.forEach((issue) => console.error(`  - ${issue}`));
    console.error("\nFix the spreadsheet before starting the app.\n");
    process.exit(1);
  }

  process.stdout.write(`Spreadsheet check passed: "${path.basename(filePath)}" has no typos.\n`);
}

try {
  main();
} catch (err) {
  console.error(`Spreadsheet check failed: ${err.message}`);
  process.exit(1);
}
