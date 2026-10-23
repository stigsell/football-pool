import * as fs from "fs";
import * as path from "path";
import JSZip from "jszip";
import * as XLSX from "xlsx";

import { blankSpreadsheetPath, fillPicks, parseBlank, picksFileName } from "./utils";
import { parseFile } from "../FileGetter/utils";
import type { Picks } from "./utils";
import type { ExcelRow } from "../FileGetter/utils";

const BLANKS_DIR = path.join(__dirname, "../../public/blank-spreadsheets");
const readBlank = (weekNum: number): Buffer =>
  fs.readFileSync(path.join(BLANKS_DIR, `Week ${weekNum}.xlsx`));

const blankWeeks = fs
  .readdirSync(BLANKS_DIR)
  .map((name) => name.match(/^Week (\d+)\.xlsx$/)?.[1])
  .filter((week): week is string => week !== undefined)
  .map(Number);

const homePicks = (games: { home: string; row: number }[]): Picks =>
  Object.fromEntries(games.map((game) => [game.row, game.home])) as Picks;

const readRows = (data: ArrayBuffer): ExcelRow[] => {
  const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
  return XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[workbook.SheetNames[0]]);
};

const sheetXml = async (data: ArrayBuffer | Buffer): Promise<string> =>
  (await JSZip.loadAsync(data)).file("xl/worksheets/sheet1.xml")!.async("string");

describe("blankSpreadsheetPath and picksFileName", () => {
  it("names the blank and the filled file after the week", () => {
    expect(blankSpreadsheetPath(8)).toBe("/blank-spreadsheets/Week 8.xlsx");
    expect(picksFileName(8, "Nick")).toBe("Week 8 - Nick.xlsx");
  });
});

describe("parseBlank", () => {
  it("reads the matchups, player columns and POINTS row from the sheet", () => {
    const layout = parseBlank(readBlank(8));

    expect(layout.games[0]).toEqual({ away: "CAR", home: "GB", row: 3 });
    expect(layout.games).toHaveLength(14);
    // Noah comes before Connor in Rick's sheet, unlike PLAYERS.
    expect(layout.playerColumns.Noah).toBe("J");
    expect(layout.playerColumns.Connor).toBe("K");
    expect(Object.keys(layout.playerColumns)).toHaveLength(11);
    expect(layout.pointsRow).toBe(34);
  });

  it("rejects a sheet with no games", () => {
    const sheet = XLSX.utils.aoa_to_sheet([["WK 8", "Nick"], ["POINTS"]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const data = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    expect(() => parseBlank(data)).toThrow("No games found");
  });

  it("rejects a sheet with no POINTS row", () => {
    const sheet = XLSX.utils.aoa_to_sheet([["WK 8", "Nick"], ["CAR"], ["GB"]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const data = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    expect(() => parseBlank(data)).toThrow("No POINTS row");
  });
});

describe("fillPicks", () => {
  it("fills only the chosen player's column and MNF points", async () => {
    const blank = readBlank(8);
    const layout = parseBlank(blank);
    const picks = homePicks(layout.games);
    picks[3] = "CAR";

    const filled = await fillPicks(blank, layout, "Connor", picks, 44);
    const rows = readRows(filled);
    const games = parseFile(rows, 8);

    expect(games).toHaveLength(14);
    games.forEach((game) => {
      expect(game.picks).toHaveLength(1);
      expect(game.picks[0].player).toBe("Connor");
    });
    expect(games[0].picks[0].pick).toBe("CAR");
    expect(games[1].picks[0].pick).toBe(games[1].home);
    // The app reads each player's MNF points from the last row.
    expect(rows.slice(-1)[0]).toEqual({ "WK 8": "POINTS", Connor: 44 });
  });

  it("keeps every cell's style", async () => {
    const blank = readBlank(8);
    const layout = parseBlank(blank);
    const filled = await fillPicks(blank, layout, "Nick", homePicks(layout.games), 40);

    const styles = (xml: string) => [...xml.matchAll(/<c r="([A-Z]+\d+)" s="(\d+)"/g)].map((m) => m[0]);
    expect(styles(await sheetXml(filled))).toEqual(styles(await sheetXml(blank)));
  });

  it.each(blankWeeks)("fills every pick and the POINTS cell in the Week %i blank", async (week) => {
    const blank = readBlank(week);
    const layout = parseBlank(blank);

    const filled = await fillPicks(blank, layout, "Jake", homePicks(layout.games), 41);
    const games = parseFile(readRows(filled), week);

    expect(games.map((game) => game.picks)).toEqual(
      layout.games.map((game) => [{ player: "Jake", pick: game.home }])
    );
  });

  it("refuses to save with a game left unpicked", async () => {
    const blank = readBlank(8);
    const layout = parseBlank(blank);
    const picks = homePicks(layout.games);
    delete picks[3];

    await expect(fillPicks(blank, layout, "Nick", picks, 40)).rejects.toThrow(
      "No pick for CAR @ GB"
    );
  });

  it("refuses a player with no column", async () => {
    const blank = readBlank(8);
    const layout = { ...parseBlank(blank), playerColumns: {} };

    await expect(fillPicks(blank, layout, "Nick", {}, 40)).rejects.toThrow(
      "Nick has no column"
    );
  });
});
