import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";

import { getMNFGame, areAllGamesFinished } from "../utils/gameEventUtils";
import {
  getWinners,
  getTiebreakWinners,
  getEliminatedPlayers,
} from "../utils/winnerUtils";
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
  const eliminatedPlayers = getEliminatedPlayers(games, scores);
  const allGamesFinished = areAllGamesFinished(scores, games);

  const potentialWinners = allGamesFinished
    ? getWinners(allPlayersScores)
    : [];

  const mnfGame = getMNFGame(scores);
  const winners =
    potentialWinners.length > 0 && mnfGame
      ? getTiebreakWinners(mnfGame, potentialWinners, playersProjectedMNFPoints)
      : potentialWinners;

  return (
    <>
      <h2>Leaderboard</h2>
      {allGamesFinished ? (
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
                  {winners.includes(score[0]) && allGamesFinished ? "🏆" : null}
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
