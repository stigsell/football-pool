import React from "react";
import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";

import {
  getMNFGame,
  areAllNonUnanimousGamesFinished,
} from "../utils/gameEventUtils.js";
import {
  getWinners,
  getTiebreakWinners,
  isPlayerEliminated,
} from "../utils/winnerUtils.js";
import { getNumberOfGamesRemaining } from "../utils/gameEventUtils.js";
import { calculateAllPlayersScores } from "../utils/scoreUtils.js";

function Leaderboard({ games, scores, playersProjectedMNFPoints }) {
  const allPlayersScores = calculateAllPlayersScores(games, scores);

  const highScore = allPlayersScores[0][1];

  getNumberOfGamesRemaining(scores);

  const potentialWinners = areAllNonUnanimousGamesFinished(scores, games)
    ? getWinners(allPlayersScores)
    : [];

  const winners =
    potentialWinners.length > 0
      ? getTiebreakWinners(
          getMNFGame(scores),
          potentialWinners,
          playersProjectedMNFPoints
        )
      : potentialWinners;

  const { width, height } = useWindowSize();

  return (
    <>
      <h2>Leaderboard</h2>
      {areAllNonUnanimousGamesFinished(scores, games) && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={600}
          recycle={false}
        />
      )}

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
              <tr>
                <td>
                  {winners.includes(score[0]) &&
                    areAllNonUnanimousGamesFinished(scores, games) &&
                    "🏆"}
                  {isPlayerEliminated(
                    highScore,
                    score[1],
                    getNumberOfGamesRemaining(scores)
                  ) && "❌"}
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
