import * as XLSX from "xlsx";
import { Game, Pick } from "../types";

interface ExcelRow {
  [key: string]: string | number;
}

const getKey = (weekNum: number): string => "WK " + weekNum;

const getPicks = (game: ExcelRow, weekNum: number): Pick[] => {
  // delete game[getKey(weekNum)];  // TODO fix this
  console.log(game);
  const picks: Pick[] = [];
  for (const key in game) {
    picks.push({ player: key, pick: (game[key] as string).toUpperCase().trim() });
  }
  picks.shift(); // shift() to remove first element of array because it is a parsing error "WK ##"
  return picks;
};

export const parseFile = (data: ExcelRow[], weekNum: number): Game[] => {
  const games: Game[] = [];
  for (var i = 0; i < data.length - 1; i += 2) {
    const game: Game = {
      away: data[i][getKey(weekNum)] as string,
      home: data[i + 1][getKey(weekNum)] as string,
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
