import { useEffect } from "react";
import { parseFile } from "./utils";
import * as XLSX from "xlsx";
import type { Game, PlayersProjectedMNFPoints } from "../types";

interface FileGetterProps {
  file: string | null;
  setFile: (file: string) => void;
  setGames: (games: Game[]) => void;
  setWeekNum: (weekNum: number) => void;
  setProjectedMNFPoints: (points: PlayersProjectedMNFPoints) => void;
}

function FileGetter({
  file: _file,
  setFile,
  setGames,
  setWeekNum,
  setProjectedMNFPoints,
}: FileGetterProps) {
  useEffect(() => {
    async function fetchAndParseExcel() {
      const weekNum = 18;
      const response = await fetch("/spreadsheets/Week " + weekNum + ";.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json_file = XLSX.utils.sheet_to_json(worksheet);

      setWeekNum(weekNum);
      setFile("Week " + weekNum + ";.xlsx");
      const games = parseFile(json_file as Array<{ [key: string]: string | number }>, weekNum);
      setGames(games);
      setProjectedMNFPoints(json_file.slice(-1)[0] as PlayersProjectedMNFPoints);
    }
    fetchAndParseExcel();
  }, [setFile, setGames, setWeekNum, setProjectedMNFPoints]);

  return null;
}

export default FileGetter;
