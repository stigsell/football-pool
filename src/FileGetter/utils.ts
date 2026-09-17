import * as XLSX from "xlsx";
import type { Game, Pick } from "../types";
import type { Player, PlayerPick, RickTeamCode } from "../utils/constants";

export interface ExcelRow {
  [key: string]: string | number | undefined;
}

const getKey = (weekNum: number): string => "WK " + weekNum;

const getPicks = (game: ExcelRow, weekNum: number): Pick[] => {
  const picks: Pick[] = [];
  for (const key in game) {
    if (key === getKey(weekNum)) continue; // Skip the week key
    const value = game[key];
    if (typeof value === 'string') {
      picks.push({
        player: key as Player,
        pick: value.toUpperCase().trim() as PlayerPick
      });
    }
  }
  return picks;
};

export const parseFile = (data: ExcelRow[], weekNum: number): Game[] => {
  const games: Game[] = [];
  for (let i = 0; i < data.length - 1; i += 2) {
    const awayValue = data[i][getKey(weekNum)];
    const homeValue = data[i + 1][getKey(weekNum)];
    if (typeof awayValue !== 'string' || typeof homeValue !== 'string') continue;

    const game: Game = {
      away: awayValue as RickTeamCode,
      home: homeValue as RickTeamCode,
      picks: getPicks(data[i + 1], weekNum),
    };
    games.push(game);
  }
  return games;
};

export const readFile = async (file: File): Promise<ExcelRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const json_data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { blankrows: false });
  return json_data;
};
