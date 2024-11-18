import * as XLSX from "xlsx";
import { PLAYERS } from "./constants";

const getPicks = (game) => {
  delete game["WK 11"];
  const picks = [];
  for (const key in game) {
    picks.push({ player: key, pick: game[key] });
  }
  return picks;
};

export const parseFile = (data) => {
  const games = [];
  for (var i = 0; i < data.length - 1; i += 2) {
    const game = {};
    game.away = data[i]["WK 11"];
    game.home = data[i + 1]["WK 11"];
    game.picks = getPicks(data[i + 1]);
    games.push(game);
  }
  return games;
};

export const readFile = async (file) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const json_data = XLSX.utils.sheet_to_json(worksheet, { blankRows: false });
  return json_data;
};
