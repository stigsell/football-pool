import { useMemo } from "react";
import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";

import {
  getClinchedWinners,
  getEliminatedPlayersWithTiebreak,
} from "../utils/scenarioUtils";
import { simulateWinProbabilities } from "../utils/simulationUtils";
import { getRemainingGames } from "../utils/gameEventUtils";
import { calculateAllPlayersScores } from "../utils/scoreUtils";
import type { Game, ESPNScoresResponse, PlayersProjectedMNFPoints } from "../types";

interface LeaderboardProps {
  games: Game[];
  scores?: ESPNScoresResponse;
  playersProjectedMNFPoints: PlayersProjectedMNFPoints;
}

const formatWinChance = (probability: number): string => {
  const percent = probability * 100;
  return (percent > 0 && percent < 1 ? "<1" : Math.round(percent).toString()) + "%";
};

function Leaderboard({ games, scores, playersProjectedMNFPoints }: LeaderboardProps) {
  const { width, height } = useWindowSize();

  // Simulated once per set of inputs so the odds don't reshuffle on every render.
  const winProbabilities = useMemo(
    () =>
      scores && getRemainingGames(games, scores).length > 0
        ? simulateWinProbabilities(games, scores, playersProjectedMNFPoints)
        : undefined,
    [games, scores, playersProjectedMNFPoints]
  );

  if (!scores) return null;

  const allPlayersScores = calculateAllPlayersScores(games, scores);
  const eliminatedPlayers = getEliminatedPlayersWithTiebreak(
    games,
    scores,
    playersProjectedMNFPoints
  );
  // Decided once nothing left to play can change the winners, which can be
  // before MNF ends when the tiebreaker is already settled.
  const winners = getClinchedWinners(games, scores, playersProjectedMNFPoints);
  const winnersDecided = winners.length > 0;
  const showWinChance = winProbabilities !== undefined && !winnersDecided;

  return (
    <>
      <h2>Leaderboard</h2>
      {winnersDecided ? (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={600}
          recycle={false}
        />
      ) : null}

      <div className="Leaderboard">
        <table className="Leaderboard__table">
          <thead>
            <tr>
              <td>
                <b>Result</b>
              </td>
              <td>
                <b>Player</b>
              </td>
              <td>
                <b># Correct</b>
              </td>
              {showWinChance && (
                <td>
                  <b>Win %</b>
                </td>
              )}
            </tr>
          </thead>
          <tbody>
            {allPlayersScores.map((score) => (
              <tr key={score[0]}>
                <td>
                  {winners.includes(score[0]) ? "🏆" : null}
                  {eliminatedPlayers.includes(score[0]) ? "❌" : null}
                </td>
                <td>{score[0]}</td>
                <td>{score[1]}</td>
                {showWinChance && (
                  <td>
                    {eliminatedPlayers.includes(score[0])
                      ? null
                      : formatWinChance(winProbabilities[score[0]])}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Leaderboard;
