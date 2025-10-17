import { useEffect } from "react";
import { parseFile } from "./utils";
import * as XLSX from "xlsx";

function FileGetter({
  file,
  setFile,
  setGames,
  setWeekNum,
  setProjectedMNFPoints,
}) {
  useEffect(() => {
    async function fetchAndParseExcel() {
      const weekNum = 7;
      const response = await fetch("/spreadsheets/Week " + weekNum + ";.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json_file = XLSX.utils.sheet_to_json(worksheet);

      setWeekNum(weekNum);
      setFile("Week " + weekNum + ";.xlsx");
      const games = parseFile(json_file, weekNum);
      setGames(games);
      setProjectedMNFPoints(json_file.slice(-1)[0]);
    }
    fetchAndParseExcel();
  }, [setFile, setGames, setWeekNum, setProjectedMNFPoints]);

  return null;
}

export default FileGetter;
