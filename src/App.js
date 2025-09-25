import React, { useState } from "react";

import PickSubmission from "./PickSubmission/PickSubmission";
import FileGetter from "./FileGetter/FileGetter";
import ScoreFetcher from "./ScoreFetcher/ScoreFetcher";
import Leaderboard from "./Leaderboard/Leaderboard";
import Tiebreaker from "./Tiebreaker/Tiebreaker";
import Games from "./Games/Games";
import SeasonResults from "./SeasonResults/SeasonResults";

import "./App.css";

function App() {
  const [inputFile, setInputFile] = useState(null);
  const [weekNum, setWeekNum] = useState(0);
  const [games, setGames] = useState([]);
  const [projectedMNFPoints, setProjectedMNFPoints] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [mode, setMode] = useState("pickSubmission"); // "leaderboard", "pickSubmission"

  return (
    <div className="App">
      <header className="App-header">
        <h1>Siegl Football Pool</h1>
      </header>
      {mode === "pickSubmission" && <PickSubmission />}
      {mode === "leaderboard" && (
        <>
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
                <Leaderboard
                  games={games}
                  playersProjectedMNFPoints={projectedMNFPoints}
                />
              </ScoreFetcher>
              <ScoreFetcher weekNumber={weekNum}>
                <Games games={games} />
              </ScoreFetcher>
              <ScoreFetcher weekNumber={weekNum}>
                <Tiebreaker
                  playersProjectedMNFPoints={projectedMNFPoints}
                  games={games}
                />
              </ScoreFetcher>
              <SeasonResults />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
