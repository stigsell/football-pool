import React from "react";
import { PLAYERS } from "../utils/constants";
import { getNumberOfGamesRemaining } from "../utils/gameEventUtils";
import { isPlayerEliminated } from "../utils/winnerUtils";
import { calculateAllPlayersScores } from "../utils/scoreUtils.js";

function Tiebreaker({ playersProjectedMNFPoints, games, scores }) {
  const getPlayerScore = (player, allPlayersScores) =>
    allPlayersScores.find((playerScore) => player === playerScore[0])[1];
  const allPlayersScores = calculateAllPlayersScores(games, scores);

  const highScore = allPlayersScores[0][1];
  return (
    <>
      <h2>Tiebreaker</h2>
      <div className="Tiebreaker">
        <table className="Tiebreaker__table">
          <thead>
            <tr>
              <td>
                <b>Player</b>
              </td>
              <td>
                <b>Estimated MNF Points</b>
              </td>
            </tr>
          </thead>
          <tbody>
            {PLAYERS.map((player) => {
              return (
                getNumberOfGamesRemaining(scores) > 1 ||
                (!isPlayerEliminated(
                  highScore,
                  getPlayerScore(player, allPlayersScores),
                  getNumberOfGamesRemaining(scores)
                ) && (
                  <tr>
                    <td>{player}</td>
                    <td>{playersProjectedMNFPoints[player]}</td>
                  </tr>
                ))
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Tiebreaker;
