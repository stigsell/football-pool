import React from "react";
import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";

import { calculateAllPlayersScores, areAllGamesFinished } from "../utils.js";

function Leaderboard({ games, scores }) {
  console.log("scores", scores);
  const allPlayersScores = calculateAllPlayersScores(games, scores);

  const highScore = allPlayersScores[0][1];

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
                  {score[1] === highScore && areAllGamesFinished(scores)
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
