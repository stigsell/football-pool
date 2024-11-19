import React from "react";
import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";

import {
  calculateAllPlayersScores,
  areAllGamesFinished,
  getWinners,
  getTiebreakWinners,
  getMNFGame,
} from "../utils.js";

function Leaderboard({ games, scores, playersProjectedMNFPoints }) {
  const allPlayersScores = calculateAllPlayersScores(games, scores);

  const potentialWinners = areAllGamesFinished(scores)
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
      {areAllGamesFinished(scores) && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={400}
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
                  {winners.includes(score[0]) && areAllGamesFinished(scores)
                    ? "🏆"
                    : ""}
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
