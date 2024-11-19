import React from "react";

import { calculateAllPlayersScores, areAllGamesFinished } from "../utils.js";

function Leaderboard({ games, scores }) {
  console.log("scores", scores);
  const allPlayersScores = calculateAllPlayersScores(games, scores);

  const highScore = allPlayersScores[0][1];

  return (
    <>
      <h2>Leaderboard</h2>
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
