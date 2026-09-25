#!/usr/bin/env node
/**
 * Advance Week
 *
 * Closes out the current week and rolls the site over to the next one:
 *   1. Records the current week's correct picks in src/data/seasonResults.json
 *      and recounts every recorded week's late picks
 *   2. Bumps CURRENT_WEEK in src/utils/constants.ts
 *   3. Copies the new spreadsheet into public/spreadsheets
 *   4. Checks the new spreadsheet for typos, refusing to run if it finds any
 *   5. Prints the git + deploy commands to finish the job
 *
 * Usage: npm run advance-week -- <path to next week's .xlsx> [--force]
 *
 * The typo check runs before anything is written, so a bad spreadsheet leaves
 * the repo untouched rather than half advanced. --force records the current
 * week even if some of its games have not finished, and lets an already
 * recorded week be overwritten.
 *
 * Scoring comes from the app's own modules, so the recorded totals are the
 * same numbers the site shows.
 */
import * as fs from "fs";
import * as path from "path";

import {
  ROOT,
  findSpreadsheet,
  checkSpreadsheet,
  readSpreadsheet,
  findWeekKey,
} from "./check-spreadsheet";
import { CURRENT_WEEK, PLAYERS, ESPN_API_URL } from "../src/utils/constants";
import { parseFile } from "../src/FileGetter/utils";
import { calculateAllPlayersScores, checkScore } from "../src/utils/scoreUtils";
import { getWinners, getTiebreakWinners } from "../src/utils/winnerUtils";
import { countLatePicks } from "../src/utils/seasonUtils";
import { getMNFGame } from "../src/utils/gameEventUtils";
import type { Player } from "../src/utils/constants";
import type { ExcelRow } from "../src/FileGetter/utils";
import type {
  ESPNScoresResponse,
  Game,
  PlayersProjectedMNFPoints,
  SeasonResultsData,
  SeasonWeekResult,
} from "../src/types";

const CONSTANTS_PATH = path.join(ROOT, "src/utils/constants.ts");
const SEASON_RESULTS_PATH = path.join(ROOT, "src/data/seasonResults.json");
const SPREADSHEETS_DIR = path.join(ROOT, "public/spreadsheets");

const spreadsheetName = (weekNum: number): string => `Week ${weekNum};.xlsx`;

function parseArgs(argv: string[]): { filePath: string; force: boolean } {
  const args = argv.slice(2);
  const force = args.includes("--force");
  const filePath = args.find((arg) => !arg.startsWith("--"));

  if (!filePath) {
    throw new Error(
      "No spreadsheet given.\n" +
        "  Usage: npm run advance-week -- <path to next week's .xlsx> [--force]"
    );
  }
  if (path.extname(filePath).toLowerCase() !== ".xlsx") {
    throw new Error(`Expected a .xlsx file but got "${filePath}".`);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Spreadsheet not found: ${resolved}`);
  }
  return { filePath: resolved, force };
}

// The app reads the week's picks from every row but the last, which holds each
// player's MNF points estimate.
function readWeek(
  filePath: string,
  weekNum: number
): { games: Game[]; projectedMNFPoints: PlayersProjectedMNFPoints } {
  const rows = readSpreadsheet(filePath) as ExcelRow[];
  return {
    games: parseFile(rows, weekNum),
    projectedMNFPoints: rows.slice(-1)[0] as PlayersProjectedMNFPoints,
  };
}

async function fetchScores(weekNum: number): Promise<ESPNScoresResponse> {
  const response = await fetch(ESPN_API_URL + weekNum);
  if (!response.ok) {
    throw new Error(
      `ESPN returned ${response.status} ${response.statusText} for week ${weekNum}.`
    );
  }
  return response.json() as Promise<ESPNScoresResponse>;
}

// Games the app cannot score yet, so the week is not safe to record.
const getUnscoredGames = (games: Game[], scores: ESPNScoresResponse): string[] =>
  games
    .filter((game) => checkScore(game, scores)?.status !== "Final")
    .map((game) => {
      const status = checkScore(game, scores)?.status ?? "no matching ESPN game";
      return `${game.away} @ ${game.home} (${status})`;
    });

// The week's correct picks and its winner, decided exactly as the Leaderboard
// decides them: most correct picks, then the MNF points tiebreaker.
function scoreWeek(
  weekNum: number,
  games: Game[],
  scores: ESPNScoresResponse,
  projectedMNFPoints: PlayersProjectedMNFPoints
): SeasonWeekResult {
  const standings = calculateAllPlayersScores(games, scores);

  const byPlayer = new Map<Player, number>(standings);
  const correctPicks: SeasonWeekResult["correctPicks"] = {};
  for (const player of PLAYERS) correctPicks[player] = byPlayer.get(player) ?? 0;

  const tiedAtTop = getWinners(standings);
  const mnfGame = getMNFGame(scores);
  const winners =
    tiedAtTop.length > 1 && mnfGame
      ? getTiebreakWinners(mnfGame, tiedAtTop, projectedMNFPoints)
      : tiedAtTop;

  return { week: weekNum, correctPicks, winners };
}

// Late picks are read from the spreadsheets rather than the scores, so every
// recorded week is recounted on each run: a spreadsheet corrected after its
// week was recorded still makes it into the season's late pick totals. A week
// whose spreadsheet is no longer around keeps the count it already has.
function recountLatePicks(weeks: SeasonWeekResult[]): number[] {
  const skipped: number[] = [];

  for (const week of weeks) {
    const filePath = path.join(SPREADSHEETS_DIR, spreadsheetName(week.week));
    if (!fs.existsSync(filePath)) {
      skipped.push(week.week);
      continue;
    }

    const { games } = readWeek(filePath, week.week);
    if (games.length === 0) {
      skipped.push(week.week);
      continue;
    }

    week.latePicks = countLatePicks(games);
  }

  return skipped;
}

function readSeasonResults(): SeasonResultsData {
  const data = JSON.parse(fs.readFileSync(SEASON_RESULTS_PATH, "utf8")) as SeasonResultsData;
  if (!Array.isArray(data.weeks)) {
    throw new Error(`${SEASON_RESULTS_PATH} has no "weeks" array.`);
  }
  return data;
}

function writeSeasonResults(data: SeasonResultsData): void {
  const weeks = [...data.weeks].sort((a, b) => a.week - b.week);
  fs.writeFileSync(SEASON_RESULTS_PATH, JSON.stringify({ ...data, weeks }, null, 2) + "\n");
}

function bumpCurrentWeek(currentWeek: number, nextWeek: number): void {
  const text = fs.readFileSync(CONSTANTS_PATH, "utf8");
  const updated = text.replace(
    new RegExp(`(CURRENT_WEEK\\s*=\\s*)${currentWeek}\\b`),
    `$1${nextWeek}`
  );
  if (updated === text) {
    throw new Error(`Could not bump CURRENT_WEEK to ${nextWeek} in ${CONSTANTS_PATH}`);
  }
  fs.writeFileSync(CONSTANTS_PATH, updated);
}

function printNextSteps(nextWeek: number): void {
  const files = [
    "src/data/seasonResults.json",
    "src/utils/constants.ts",
    `"public/spreadsheets/${spreadsheetName(nextWeek)}"`,
  ].join(" ");

  process.stdout.write("\nRun this to publish the change:\n\n");
  process.stdout.write(
    `  git add ${files} && \\\n` +
      `    git commit -m "Week ${nextWeek}" && \\\n` +
      `    git push && \\\n` +
      `    npm run deploy\n\n`
  );
}

async function main(): Promise<void> {
  const { filePath, force } = parseArgs(process.argv);
  const nextWeek = CURRENT_WEEK + 1;

  // 4 (run first): a bad spreadsheet must not leave the repo half advanced.
  const issues = checkSpreadsheet(filePath);
  if (issues.length > 0) {
    throw new Error(
      `Found ${issues.length} issue(s) in "${path.basename(filePath)}":\n` +
        issues.map((issue) => `  - ${issue}`).join("\n") +
        "\n\nFix the spreadsheet and run again. Nothing has been changed."
    );
  }

  // The app reads picks from a "WK <n>" column matching CURRENT_WEEK, so a
  // spreadsheet labelled for a different week would render an empty site.
  const weekKey = findWeekKey(readSpreadsheet(filePath));
  if (weekKey !== `WK ${nextWeek}`) {
    throw new Error(
      `"${path.basename(filePath)}" has a "${weekKey}" column but week ${nextWeek} ` +
        `is next, so the site would find no games.\nRename the column to ` +
        `"WK ${nextWeek}" and run again. Nothing has been changed.`
    );
  }
  process.stdout.write(
    `Checked "${path.basename(filePath)}": no typos, labelled for week ${nextWeek}.\n`
  );

  // 1. Record the current week's correct picks.
  const season = readSeasonResults();
  if (season.weeks.some((week) => week.week === CURRENT_WEEK) && !force) {
    throw new Error(
      `Week ${CURRENT_WEEK} is already recorded in seasonResults.json. ` +
        "Re-run with --force to overwrite it."
    );
  }

  const { games, projectedMNFPoints } = readWeek(
    findSpreadsheet(CURRENT_WEEK),
    CURRENT_WEEK
  );
  if (games.length === 0) {
    throw new Error(`No games found in "${spreadsheetName(CURRENT_WEEK)}".`);
  }

  const scores = await fetchScores(CURRENT_WEEK);
  const unscored = getUnscoredGames(games, scores);
  if (unscored.length > 0 && !force) {
    throw new Error(
      `Week ${CURRENT_WEEK} is not finished yet:\n` +
        unscored.map((game) => `  - ${game}`).join("\n") +
        "\n\nWait for these to go final, or re-run with --force to record the " +
        "week as it stands. Nothing has been changed."
    );
  }

  const result = scoreWeek(CURRENT_WEEK, games, scores, projectedMNFPoints);
  season.weeks = season.weeks.filter((week) => week.week !== CURRENT_WEEK);
  season.weeks.push(result);
  const skipped = recountLatePicks(season.weeks);
  writeSeasonResults(season);

  const winnerList = (result.winners ?? []).join(" & ") || "nobody";
  process.stdout.write(`Recorded week ${CURRENT_WEEK} in seasonResults.json:\n`);
  Object.entries(result.correctPicks)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .forEach(([player, correct]) => {
      const trophy = (result.winners ?? []).includes(player as Player) ? " 🏆" : "";
      process.stdout.write(`  ${player.padEnd(8)} ${correct}${trophy}\n`);
    });
  process.stdout.write(`Week ${CURRENT_WEEK} winner: ${winnerList}.\n`);

  const latePickTotals = PLAYERS.map((player): [Player, number] => [
    player,
    season.weeks.reduce((total, week) => total + (week.latePicks?.[player] ?? 0), 0),
  ]).filter(([, total]) => total > 0);
  process.stdout.write(
    `Recounted late picks across ${season.weeks.length} week(s)` +
      (skipped.length > 0
        ? ` (no spreadsheet for week${skipped.length > 1 ? "s" : ""} ${skipped.join(", ")})`
        : "") +
      ":\n"
  );
  if (latePickTotals.length === 0) {
    process.stdout.write("  nobody has been late yet\n");
  }
  latePickTotals
    .sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
    .forEach(([player, late]) => {
      process.stdout.write(`  ${player.padEnd(8)} ${late}\n`);
    });

  // 2. Advance the week number.
  bumpCurrentWeek(CURRENT_WEEK, nextWeek);
  process.stdout.write(`Bumped CURRENT_WEEK to ${nextWeek}.\n`);

  // 3. Copy the new spreadsheet in.
  const destination = path.join(SPREADSHEETS_DIR, spreadsheetName(nextWeek));
  if (path.resolve(destination) !== filePath) {
    fs.copyFileSync(filePath, destination);
  }
  process.stdout.write(
    `Copied spreadsheet to public/spreadsheets/${spreadsheetName(nextWeek)}.\n`
  );

  // 5. Tell the user how to ship it.
  printNextSteps(nextWeek);
}

if (require.main === module) {
  main().catch((err: Error) => {
    console.error(`\nAdvance week failed: ${err.message}\n`);
    process.exit(1);
  });
}
