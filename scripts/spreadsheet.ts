/**
 * Finds typos in a picks spreadsheet and fixes the ones with an obvious answer.
 * The command line entry point is check-spreadsheet.ts.
 */
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import JSZip from "jszip";
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
// Anything further off than this is too much of a guess to offer as a fix.
const MAX_FIX_DISTANCE = 2;

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

// The one candidate close enough to `target` to offer as an automatic fix. A tie
// means we can't tell which was meant, so nothing is offered.
export function suggestFix(target: string, candidates: Iterable<string>): string | undefined {
  const scored = [...candidates].map((candidate) => ({
    candidate,
    distance: editDistance(target, candidate),
  }));
  const bestDistance = Math.min(...scored.map(({ distance }) => distance));
  const best = scored.filter(({ distance }) => distance === bestDistance);
  return bestDistance <= MAX_FIX_DISTANCE && best.length === 1 ? best[0].candidate : undefined;
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

// The blank the Submit Picks page offers for a week, if it has been added.
export function findBlankSpreadsheet(weekNum: number): string | undefined {
  const filePath = path.join(ROOT, "public/blank-spreadsheets", `Week ${weekNum}.xlsx`);
  return fs.existsSync(filePath) ? filePath : undefined;
}

export type SpreadsheetRow = { [key: string]: string | number | undefined };

function readWorksheet(filePath: string): XLSX.WorkSheet {
  const workbook = XLSX.readFile(filePath);
  return workbook.Sheets[workbook.SheetNames[0]];
}

export function readSpreadsheet(filePath: string): SpreadsheetRow[] {
  return XLSX.utils.sheet_to_json<SpreadsheetRow>(readWorksheet(filePath), { blankrows: false });
}

// The "WK <n>" column the app reads picks from, if the sheet has one.
export function findWeekKey(rows: SpreadsheetRow[]): string | undefined {
  const keys = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
  return [...keys].find((key) => /^WK \d+$/.test(key));
}

export interface CellFix {
  cell: string; // e.g. "B27"
  value: string;
}

export interface Issue {
  description: string; // what is wrong
  message: string; // what is wrong, plus any "did you mean"
  fix?: CellFix;
}

const toIssue = (description: string, hint = "", fix?: CellFix): Issue => ({
  description,
  message: description + hint,
  fix,
});

// Maps each header in the sheet's first row to the column it sits in.
function readColumns(worksheet: XLSX.WorkSheet): Map<string, number> {
  const [headers] = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  const firstColumn = XLSX.utils.decode_range(worksheet["!ref"] as string).s.c;
  const columns = new Map<string, number>();
  headers.forEach((header, index) => columns.set(String(header), firstColumn + index));
  return columns;
}

export function findIssues(filePath: string): Issue[] {
  const data = readSpreadsheet(filePath);
  const weekKey = findWeekKey(data);
  const issues: Issue[] = [];

  if (!weekKey) {
    issues.push(toIssue("Could not find a 'WK <n>' column in the spreadsheet."));
    return issues;
  }

  const worksheet = readWorksheet(filePath);
  const columns = readColumns(worksheet);
  const headerRow = XLSX.utils.decode_range(worksheet["!ref"] as string).s.r;

  // Where `key` sits in a given row, paired with the value that should be there.
  const cellFix = (rowNum: number, key: string, value?: string): CellFix | undefined => {
    const column = columns.get(key);
    if (value === undefined || column === undefined) return undefined;
    return { cell: XLSX.utils.encode_cell({ r: rowNum, c: column }), value };
  };
  // sheet_to_json records each row's position, which skips over blank rows.
  const rowNumOf = (row: SpreadsheetRow): number =>
    (row as unknown as { __rowNum__: number }).__rowNum__;

  const headerKeys = new Set<string>();
  data.forEach((row) => Object.keys(row).forEach((key) => headerKeys.add(key)));
  headerKeys.delete(weekKey);
  for (const header of headerKeys) {
    if (!PLAYER_SET.has(header)) {
      // Renaming onto a player who already has a column would create a duplicate.
      const missingPlayers = PLAYERS.filter((player) => !headerKeys.has(player));
      issues.push(
        toIssue(
          `Unrecognized player column "${header}".`,
          didYouMean(header, PLAYER_SET),
          cellFix(headerRow, header, suggestFix(header, missingPlayers))
        )
      );
    }
  }

  for (let i = 0; i < data.length - 1; i += 2) {
    const awayRow = data[i];
    const homeRow = data[i + 1];
    const away = awayRow[weekKey];
    const home = homeRow[weekKey];

    if (typeof away !== "string" || typeof home !== "string") continue;

    const gameLabel = `${away} @ ${home}`;
    const teams = [
      { side: "away", code: away, row: awayRow, rowLabel: i + 2 },
      { side: "home", code: home, row: homeRow, rowLabel: i + 3 },
    ];
    for (const { side, code, row, rowLabel } of teams) {
      if (TEAM_CODES.has(code)) continue;
      issues.push(
        toIssue(
          `Row ${rowLabel}: ${side} team code "${code}" (${gameLabel}) is not a recognized team code.`,
          didYouMean(code, TEAM_CODES),
          cellFix(rowNumOf(row), weekKey, suggestFix(code.toUpperCase().trim(), TEAM_CODES))
        )
      );
    }

    // Suggest only the teams in this matchup. away/home could themselves be
    // typos, so only use the ones that are valid codes; if neither is, fall
    // back to the master list.
    const matchupTeams = [away, home].filter((team) => TEAM_CODES.has(team));

    for (const key in homeRow) {
      if (key === weekKey || !PLAYER_SET.has(key)) continue;
      const value = homeRow[key];
      if (typeof value !== "string") continue;
      const pick = value.toUpperCase().trim();
      // A late pick counts as wrong no matter who wins, so it's valid anywhere.
      if (pick === away || pick === home || pick === LATE_PICK) continue;

      const description = `Row ${i + 3}: ${key}'s pick "${value}"`;
      if (TEAM_CODES.has(pick)) {
        // A real team that isn't playing could mean either side, so don't guess.
        issues.push(
          toIssue(`${description} is not one of the teams in this matchup (${gameLabel}).`)
        );
        continue;
      }
      const candidates = matchupTeams.length > 0 ? matchupTeams : TEAM_CODES;
      // Until both team codes are right, the intended pick may be the one that's
      // misspelled in the matchup, so only fix picks in a clean matchup.
      const suggestion =
        matchupTeams.length === 2 ? suggestFix(pick, matchupTeams) : undefined;
      issues.push(
        toIssue(
          `${description} is not a recognized team code.`,
          didYouMean(pick, candidates),
          cellFix(rowNumOf(homeRow), key, suggestion)
        )
      );
    }
  }

  return issues;
}

function required<T>(value: T | null | undefined, problem: string): T {
  if (value === null || value === undefined) throw new Error(problem);
  return value;
}

// Overwrites one cell of the first sheet with `value`. The xlsx package drops
// styling when it saves a workbook, so this edits only that cell's XML and
// leaves the rest of the file, formatting included, as it was.
export async function applyFix(filePath: string, { cell, value }: CellFix): Promise<void> {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const readEntry = (name: string): Promise<string> =>
    required(zip.file(name), `"${filePath}" has no ${name}.`).async("string");

  const workbookXml = await readEntry("xl/workbook.xml");
  const sheetId = required(
    workbookXml.match(/<sheet\s[^>]*?r:id="([^"]+)"/),
    `Could not find the first sheet in "${filePath}".`
  )[1];
  const relationships = await readEntry("xl/_rels/workbook.xml.rels");
  const relationship = required(
    relationships.match(new RegExp(`<Relationship\\s[^>]*?Id="${sheetId}"[^>]*>`)),
    `Could not find the first sheet in "${filePath}".`
  )[0];
  const target = required(
    relationship.match(/Target="([^"]+)"/),
    `Could not find the first sheet in "${filePath}".`
  )[1];
  const sheetName = target.startsWith("/") ? target.slice(1) : `xl/${target}`;

  const sheetXml = await readEntry(sheetName);
  const cellPattern = new RegExp(`<c r="${cell}"(?=[\\s/>])[^>]*?(?:/>|>[\\s\\S]*?</c>)`);
  const existing = required(
    sheetXml.match(cellPattern),
    `Could not find cell ${cell} in "${filePath}".`
  )[0];
  if (/<f[\s/>]/.test(existing)) {
    throw new Error(`Cell ${cell} holds a formula, so fix it by hand.`);
  }

  const style = existing.match(/\ss="\d+"/)?.[0] ?? "";
  // Player names and team codes need no XML escaping.
  const replacement = `<c r="${cell}"${style} t="inlineStr"><is><t>${value}</t></is></c>`;
  zip.file(sheetName, sheetXml.replace(cellPattern, replacement));
  fs.writeFileSync(
    filePath,
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
  );
}

export type Confirm = (question: string) => Promise<boolean>;

// Asks a yes/no question on the terminal. Anything but yes counts as no.
export const terminalConfirm =
  (input: NodeJS.ReadableStream, output: NodeJS.WritableStream): Confirm =>
  async (question) => {
    const prompt = readline.createInterface({ input, output });
    const answer = await new Promise<string>((resolve) => prompt.question(question, resolve));
    prompt.close();
    return /^y(es)?$/i.test(answer.trim());
  };

// Offers each available fix in turn, rechecking after every change since fixing
// a team code can resolve, or make fixable, the picks beneath it. Returns the
// issues still left.
export async function fixSpreadsheet(filePath: string, confirm: Confirm): Promise<Issue[]> {
  const declined = new Set<string>();
  for (;;) {
    const issues = findIssues(filePath);
    const next = issues.find((issue) => issue.fix && !declined.has(issue.fix.cell));
    if (!next?.fix) return issues;

    const fix = next.fix;
    const accepted = await confirm(
      `\n${path.basename(filePath)}: ${next.description}\n` +
        `Would you like to update to "${fix.value}"? [y/N] `
    );
    if (accepted) {
      await applyFix(filePath, fix);
      process.stdout.write(`Updated cell ${fix.cell} to "${fix.value}".\n`);
    } else {
      declined.add(fix.cell);
    }
  }
}

// A confirm for the current terminal, or none if there's nobody there to answer.
export function interactiveConfirm(): Confirm | undefined {
  return process.stdin.isTTY && process.stdout.isTTY
    ? terminalConfirm(process.stdin, process.stdout)
    : undefined;
}

// The issues in a spreadsheet, after offering to fix them if someone can confirm.
const resolveIssues = async (filePath: string, confirm?: Confirm): Promise<Issue[]> =>
  confirm ? fixSpreadsheet(filePath, confirm) : findIssues(filePath);

// Offers fixes, then throws if any typo is left. Accepted fixes are saved to the
// spreadsheet either way.
export async function requireCleanSpreadsheet(
  filePath: string,
  confirm?: Confirm
): Promise<void> {
  const issues = await resolveIssues(filePath, confirm);
  if (issues.length > 0) {
    throw new Error(
      `Found ${issues.length} issue(s) in "${path.basename(filePath)}":\n` +
        issues.map(({ message }) => `  - ${message}`).join("\n") +
        "\n\nFix the spreadsheet and run again. The repo has not been changed."
    );
  }
}

// Checks the given spreadsheet, or else the current week's and next week's blank.
// Fixes are offered only when there's someone to `confirm` them. Resolves to
// whether everything checked came out clean.
export async function runCheck(filePath?: string, confirm?: Confirm): Promise<boolean> {
  const blankPath = filePath ? undefined : findBlankSpreadsheet(CURRENT_WEEK + 1);
  const filePaths = filePath
    ? [filePath]
    : [findSpreadsheet(CURRENT_WEEK), ...(blankPath ? [blankPath] : [])];
  let failed = false;

  for (const current of filePaths) {
    const issues = await resolveIssues(current, confirm);
    if (issues.length > 0) {
      failed = true;
      console.error(`\nFound ${issues.length} issue(s) in "${path.basename(current)}":\n`);
      issues.forEach(({ message }) => console.error(`  - ${message}`));
      continue;
    }
    process.stdout.write(`Spreadsheet check passed: "${path.basename(current)}" has no typos.\n`);
  }

  if (failed) {
    console.error("\nFix the spreadsheet before starting the app.\n");
  } else if (!filePath && !blankPath) {
    console.warn(
      `No blank for week ${CURRENT_WEEK + 1} in public/blank-spreadsheets, ` +
        "so Submit Picks will say picks aren't open."
    );
  }
  return !failed;
}
