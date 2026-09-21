import { useState } from "react";

import FileGetter from "./FileGetter/FileGetter";
import ScoreFetcher from "./ScoreFetcher/ScoreFetcher";
import Leaderboard from "./Leaderboard/Leaderboard";
import Tiebreaker from "./Tiebreaker/Tiebreaker";
import Games from "./Games/Games";
import SeasonResults from "./SeasonResults/SeasonResults";

import "./App.css";
import type { Game, PlayersProjectedMNFPoints } from "./types";

function App() {
  const [inputFile, setInputFile] = useState<string | null>(null);
  const [weekNum, setWeekNum] = useState<number>(0);
  const [games, setGames] = useState<Game[]>([]);
  const [projectedMNFPoints, setProjectedMNFPoints] = useState<PlayersProjectedMNFPoints>({});

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
          {/* One fetcher for the whole page: it hands the same scores to
              every child, so the week's scores are fetched once. */}
          <ScoreFetcher weekNumber={weekNum}>
            <Leaderboard
              games={games}
              playersProjectedMNFPoints={projectedMNFPoints}
            />
            <Games games={games} />
            <Tiebreaker
              games={games}
              playersProjectedMNFPoints={projectedMNFPoints}
            />
            <SeasonResults week={weekNum} games={games} />
          </ScoreFetcher>
        </>
      )}
    </div>
  );
}

export default App;
