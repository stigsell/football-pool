import {
  getSeasonTotals,
  getWeekWinners,
  getLiveWeekResult,
  withLiveWeek,
} from "../utils/seasonUtils";
import seasonResults from "../data/seasonResults.json";
import type { ESPNScoresResponse, Game, SeasonResultsData } from "../types";

interface SeasonResultsProps {
  week?: number;
  games?: Game[];
  scores?: ESPNScoresResponse;
}

function SeasonResults({ week, games, scores }: SeasonResultsProps) {
  const { weeks } = seasonResults as SeasonResultsData;
  const liveWeek = getLiveWeekResult(week, games, scores);
  const seasonTotals = getSeasonTotals(withLiveWeek(weeks, liveWeek));
  const weekWinners = getWeekWinners(weeks);

  return (
    <>
      <h2>Season Results</h2>

      <div className="SeasonResults">
        <table className="SeasonResults__table">
          <thead>
            <tr>
              <td>
                <b>Week</b>
              </td>
              <td>
                <b>Winner</b>
              </td>
            </tr>
          </thead>
          <tbody>
            {weekWinners.map(({ week: weekNum, winner }) => (
              <tr key={weekNum}>
                <td>{weekNum}</td>
                <td>{winner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="SeasonResults">
        <table className="SeasonResults__table">
          <thead>
            <tr>
              <td>
                <b>Player</b>
              </td>
              <td>
                <b># Correct</b>
              </td>
            </tr>
          </thead>
          <tbody>
            {seasonTotals.map(([player, total]) => (
              <tr key={player}>
                <td>{player}</td>
                <td>{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default SeasonResults;
