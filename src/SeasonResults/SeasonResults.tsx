import {
  getSeasonTotals,
  getWeekWinners,
  getLatePickTotals,
  getSeasonEarnings,
  getBestWeeks,
  getWorstWeeks,
  getMostAlikePairs,
  getLiveWeekResult,
  withLiveWeek,
} from "../utils/seasonUtils";
import { formatMoney } from "../utils/formatUtils";
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
  const allWeeks = withLiveWeek(weeks, liveWeek);
  const seasonTotals = getSeasonTotals(allWeeks);
  const latePickTotals = getLatePickTotals(allWeeks).filter(([, total]) => total > 0);
  const weekWinners = getWeekWinners(weeks);
  const earnings = getSeasonEarnings(weeks);
  const weekDetails = (records: ReturnType<typeof getBestWeeks>): string[] =>
    records.map(({ week: weekNum, players }) => `Week ${weekNum} \u2022 ${players.join(", ")}`);
  const bestWeeks = getBestWeeks(weeks);
  const worstWeeks = getWorstWeeks(weeks);
  const alikePairs = getMostAlikePairs(allWeeks);
  const recordCards = [
    { label: "Best Week", number: bestWeeks[0]?.correct, details: weekDetails(bestWeeks) },
    { label: "Worst Week", number: worstWeeks[0]?.correct, details: weekDetails(worstWeeks) },
    {
      label: "Most Same Picks",
      number: alikePairs[0]?.count,
      details: alikePairs.map(({ players }) => players.join(" & ")),
    },
  ].filter(({ details }) => details.length > 0);

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

      <div className="SeasonResults">
        <table className="SeasonResults__table">
          <thead>
            <tr>
              <td>
                <b>Player</b>
              </td>
              <td>
                <b># Late Picks</b>
              </td>
            </tr>
          </thead>
          <tbody>
            {latePickTotals.map(([player, total]) => (
              <tr key={player}>
                <td>{player}</td>
                <td>{total}</td>
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
                <b>Net Winnings</b>
              </td>
            </tr>
          </thead>
          <tbody>
            {earnings.map(({ player, net }) => (
              <tr key={player}>
                <td>{player}</td>
                <td>{formatMoney(net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="SeasonResults__cards">
        {recordCards.map(({ label, number, details }) => (
          <div className="SeasonResults__card" key={label}>
            <div className="SeasonResults__cardHeader">{label}</div>
            <div className="SeasonResults__cardNumber">{number}</div>
            {details.map((detail) => (
              <div className="SeasonResults__cardDetail" key={detail}>
                {detail}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default SeasonResults;
