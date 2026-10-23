import JSZip from "jszip";
import * as XLSX from "xlsx";
import { PLAYERS, RICK_TO_ESPN_MAP } from "../utils/constants";
import type { Player, RickTeamCode } from "../utils/constants";

export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// The first sheet of every blank Rick sends.
const SHEET_PATH = "xl/worksheets/sheet1.xml";

const PLAYER_SET = new Set<string>(PLAYERS);
const TEAM_CODES = new Set<string>(RICK_TO_ESPN_MAP.keys());

// Picks open for the week after the one being played.
export const blankSpreadsheetPath = (weekNum: number): string =>
  `/blank-spreadsheets/Week ${weekNum}.xlsx`;

export const picksFileName = (weekNum: number, player: Player): string =>
  `Week ${weekNum} - ${player}.xlsx`;

// A matchup in a blank, and the sheet row its picks go on: Rick records picks
// on the home team's row, the second of each pair.
export interface BlankGame {
  away: RickTeamCode;
  home: RickTeamCode;
  row: number;
}

// Where each part of a blank lives, read from the sheet itself because the
// player columns are not in PLAYERS order and the POINTS row moves with the
// number of games.
export interface BlankLayout {
  games: BlankGame[];
  playerColumns: Partial<Record<Player, string>>;
  pointsRow: number;
}

export type Picks = Partial<Record<number, RickTeamCode>>;

const isTeamCode = (value: unknown): value is RickTeamCode =>
  typeof value === "string" && TEAM_CODES.has(value.trim());

export const parseBlank = (data: ArrayBuffer | Uint8Array): BlankLayout => {
  const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  // header: 1 keeps every row, so row index i is sheet row i + 1.
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: true,
  });

  const playerColumns: Partial<Record<Player, string>> = {};
  (rows[0] ?? []).forEach((header, col) => {
    if (typeof header === "string" && PLAYER_SET.has(header.trim())) {
      playerColumns[header.trim() as Player] = XLSX.utils.encode_col(col);
    }
  });

  const games: BlankGame[] = [];
  for (let i = 1; i + 1 < rows.length; i += 2) {
    const away = rows[i]?.[0];
    const home = rows[i + 1]?.[0];
    if (!isTeamCode(away) || !isTeamCode(home)) break;
    games.push({ away: away.trim() as RickTeamCode, home: home.trim() as RickTeamCode, row: i + 2 });
  }

  const pointsIndex = rows.findIndex(
    (row) => typeof row?.[0] === "string" && row[0].trim().toUpperCase() === "POINTS"
  );

  if (games.length === 0) throw new Error("No games found in the blank spreadsheet.");
  if (pointsIndex === -1) throw new Error("No POINTS row found in the blank spreadsheet.");

  return { games, playerColumns, pointsRow: pointsIndex + 1 };
};

// Rewrites one cell of the sheet XML in place. The blanks already hold an
// empty, styled cell for every pick, so keeping its attributes (minus any old
// type) keeps Rick's formatting, which SheetJS would drop on write.
const setCell = (xml: string, ref: string, content: string, type?: string): string => {
  const pattern = new RegExp(`<c r="${ref}"([^>]*?)(?:/>|>[\\s\\S]*?</c>)`);
  const match = xml.match(pattern);
  if (!match) throw new Error(`Cell ${ref} is missing from the blank spreadsheet.`);

  const attrs = match[1].replace(/\s+t="[^"]*"/, "");
  const typeAttr = type ? ` t="${type}"` : "";
  return xml.replace(pattern, `<c r="${ref}"${attrs}${typeAttr}>${content}</c>`);
};

// The blank with one player's picks and MNF points filled in, every other
// column left empty.
export const fillPicks = async (
  data: ArrayBuffer | Uint8Array,
  layout: BlankLayout,
  player: Player,
  picks: Picks,
  mnfPoints: number
): Promise<ArrayBuffer> => {
  const column = layout.playerColumns[player];
  if (!column) throw new Error(`${player} has no column in the blank spreadsheet.`);

  const zip = await JSZip.loadAsync(new Uint8Array(data));
  const sheet = zip.file(SHEET_PATH);
  if (!sheet) throw new Error("The blank spreadsheet has no first sheet.");

  let xml = await sheet.async("string");
  for (const game of layout.games) {
    const pick = picks[game.row];
    if (!pick) throw new Error(`No pick for ${game.away} @ ${game.home}.`);
    xml = setCell(xml, `${column}${game.row}`, `<is><t>${pick}</t></is>`, "inlineStr");
  }
  xml = setCell(xml, `${column}${layout.pointsRow}`, `<v>${mnfPoints}</v>`);

  zip.file(SHEET_PATH, xml);
  return zip.generateAsync({ type: "arraybuffer", mimeType: XLSX_MIME_TYPE });
};
