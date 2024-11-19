import React from "react";

import { checkScore } from "../utils.js";

export const calculatePlayerTotalScore = (player, games, scores) => {
  let playerScore = 0;
  for (const game of games) {
    const pick = game.picks.filter((pick) => pick.player === player)[0].pick;
    if (
      (checkScore(game, scores)["status"] === "Final" &&
        Number(checkScore(game, scores)["away_score"]) >
          Number(checkScore(game, scores)["home_score"]) &&
        pick === game.away) ||
      (Number(checkScore(game, scores)["home_score"]) >
        Number(checkScore(game, scores)["away_score"]) &&
        pick === game.home)
    ) {
      playerScore++;
    }
  }
  return playerScore;
};

function Leaderboard({ games, scores }) {
  return (
    <>
      <h2>Leaderboard</h2>
      <div className="Leaderboard">
        <table className="Leaderboard__table">
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
            <tr>
              <td>{"Adam"}</td>
              <td>{calculatePlayerTotalScore("Adam", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Alex"}</td>
              <td>{calculatePlayerTotalScore("Alex", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Ben"}</td>
              <td>{calculatePlayerTotalScore("Ben", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Connor"}</td>
              <td>{calculatePlayerTotalScore("Connor", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Kylee"}</td>
              <td>{calculatePlayerTotalScore("Kylee", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Nick"}</td>
              <td>{calculatePlayerTotalScore("Nick", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Noah"}</td>
              <td>{calculatePlayerTotalScore("Noah", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Rick"}</td>
              <td>{calculatePlayerTotalScore("Rick", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Ricky"}</td>
              <td>{calculatePlayerTotalScore("Ricky", games, scores)}</td>
            </tr>
            <tr>
              <td>{"Tammy"}</td>
              <td>{calculatePlayerTotalScore("Tammy", games, scores)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Leaderboard;
