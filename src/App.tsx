import { useEffect, useState } from "react";

import FileGetter from "./FileGetter/FileGetter";
import ScoreFetcher from "./ScoreFetcher/ScoreFetcher";
import Leaderboard from "./Leaderboard/Leaderboard";
import Tiebreaker from "./Tiebreaker/Tiebreaker";
import WinScenarios from "./WinScenarios/WinScenarios";
import Games from "./Games/Games";
import SeasonResults from "./SeasonResults/SeasonResults";
import SubmitPicks from "./SubmitPicks/SubmitPicks";

import "./App.css";
import { gameKey } from "./utils/simulationUtils";
import type { SimulatedWinners } from "./utils/simulationUtils";
import type { RickTeamCode } from "./utils/constants";
import type { Game, PlayersProjectedMNFPoints } from "./types";

// A hash route keeps GitHub Pages happy: every page is served from index.html.
const SUBMIT_PICKS_HASH = "#/submit-picks";

const useHash = (): string => {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return hash;
};

function App() {
  const isSubmitPicks = useHash() === SUBMIT_PICKS_HASH;
  const [inputFile, setInputFile] = useState<string | null>(null);
  const [weekNum, setWeekNum] = useState<number>(0);
  const [games, setGames] = useState<Game[]>([]);
  const [projectedMNFPoints, setProjectedMNFPoints] = useState<PlayersProjectedMNFPoints>({});

  const [simulated, setSimulated] = useState<SimulatedWinners>({});

  // Picking the team that is already chosen clears the simulation.
  const toggleSimulatedWinner = (game: Game, team: RickTeamCode) =>
    setSimulated((current) => {
      const { [gameKey(game)]: chosen, ...rest } = current;
      return chosen === team ? rest : { ...rest, [gameKey(game)]: team };
    });

  return (
    <div className="App">
      <header className="App-header">
        <h1>Siegl Football Pool</h1>
        <nav className="App-nav">
          <a href="#/" aria-current={isSubmitPicks ? undefined : "page"}>
            Scoreboard
          </a>
          <a href={SUBMIT_PICKS_HASH} aria-current={isSubmitPicks ? "page" : undefined}>
            Submit Picks
          </a>
        </nav>
      </header>

      {isSubmitPicks ? (
        <SubmitPicks />
      ) : (
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
              {/* One fetcher for the whole page: it hands the same scores to
                  every child, so the week's scores are fetched once. */}
              <ScoreFetcher weekNumber={weekNum} games={games} simulated={simulated}>
                <Leaderboard
                  games={games}
                  playersProjectedMNFPoints={projectedMNFPoints}
                  isSimulating={Object.keys(simulated).length > 0}
                />
                <Games
                  games={games}
                  simulated={simulated}
                  onSimulate={toggleSimulatedWinner}
                  onResetSimulations={() => setSimulated({})}
                />
                <WinScenarios
                  games={games}
                  playersProjectedMNFPoints={projectedMNFPoints}
                />
                <Tiebreaker
                  games={games}
                  playersProjectedMNFPoints={projectedMNFPoints}
                />
                <SeasonResults week={weekNum} games={games} />
              </ScoreFetcher>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
