import React, { useState } from "react";

import FileGetter from "./FileGetter/FileGetter";
import ScoreFetcher from "./ScoreFetcher/ScoreFetcher";
import Games from "./Games/Games";
import Leaderboard from "./Leaderboard/Leaderboard";

import "./App.css";
import Tiebreaker from "./Tiebreaker/Tiebreaker";

function App() {
  const [inputFile, setInputFile] = useState(null);
  const [weekNum, setWeekNum] = useState(0);
  const [games, setGames] = useState([]);
  const [projectedMNFPoints, setProjectedMNFPoints] = useState({});

  return (
    <div className="App">
      <header className="App-header">
        <h1>Siegl Football Pool</h1>
      </header>

      <FileGetter
        file={inputFile}
        setFile={setInputFile}
        setGames={setGames}
        setWeekNum={setWeekNum}
        setProjectedMNFPoints={setProjectedMNFPoints}
      />
      {inputFile !== null && (
        <>
          <h2>{weekNum > 0 && "Week " + weekNum}</h2>
          <ScoreFetcher weekNumber={weekNum}>
            <Leaderboard games={games} />
          </ScoreFetcher>
          <Tiebreaker playersProjectedMNFPoints={projectedMNFPoints} />
          <ScoreFetcher weekNumber={weekNum}>
            <Games games={games} />
          </ScoreFetcher>
        </>
      )}
    </div>
  );
}

export default App;
