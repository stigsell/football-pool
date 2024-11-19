import React from "react";
import { readFile, parseFile } from "./utils";

function FileGetter({
  file,
  setFile,
  setGames,
  setWeekNum,
  setProjectedMNFPoints,
}) {
  async function handleChange(event) {
    setFile(null);
    const file = event.target.files[0];
    setFile(file);
    console.log(file);
    const weekNum = Number(file.name.replace(/[^0-9]/g, ""));
    setWeekNum(weekNum);
    const json_file = await readFile(file);
    console.log("json_file", json_file);
    const games = parseFile(json_file, weekNum);
    setGames(games);
    console.log("games", games);
    setProjectedMNFPoints(json_file.slice(-1)[0]);
  }
  const clearFile = () => setFile(null);

  return (
    <>
      <form>
        <input
          //   key={file?.name}
          type="file"
          onChange={handleChange}
          disabled={file !== null}
          className="FileGetter__input"
        />
      </form>
      <button onClick={clearFile}>Clear file</button>
    </>
  );
}

export default FileGetter;
