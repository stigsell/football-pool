import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";

import {
  getClinchedWinners,
  getEliminatedPlayersWithTiebreak,
} from "../utils/scenarioUtils";
import { calculateAllPlayersScores } from "../utils/scoreUtils";
import type { Game, ESPNScoresResponse, PlayersProjectedMNFPoints } from "../types";

interface LeaderboardProps {
  games: Game[];
  scores?: ESPNScoresResponse;
  playersProjectedMNFPoints: PlayersProjectedMNFPoints;
}

function Leaderboard({ games, scores, playersProjectedMNFPoints }: LeaderboardProps) {
  const { width, height } = useWindowSize();

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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Leaderboard;
