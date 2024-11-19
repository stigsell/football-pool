import * as XLSX from "xlsx";

const getKey = (weekNum) => "WK " + weekNum;

const getPicks = (game, weekNum) => {
  // delete game[getKey(weekNum)];  // TODO fix this
  const picks = [];
  for (const key in game) {
    picks.push({ player: key, pick: game[key] });
  }
  picks.shift(); // shift() to remove first element of array because it is a parsing error "WK ##"
  return picks;
};

export const parseFile = (data, weekNum) => {
  const games = [];
  for (var i = 0; i < data.length - 1; i += 2) {
    const game = {};
    game.away = data[i][getKey(weekNum)];
    game.home = data[i + 1][getKey(weekNum)];
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
