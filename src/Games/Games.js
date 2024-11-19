import React from "react";

import { checkScore } from "../utils";

function Games({ games, scores }) {
  return (
    <>
      <h2>Games</h2>
      {games.map((game) => (
        <div className="Game" key={game.home + game.away}>
          <table className="Game__table">
            <thead>
              <tr>
                <td>
                  <b>{game.away}</b>
                </td>
                <td>
                  <b>{checkScore(game, scores)["status"]}</b>
                </td>
                <td>
                  <b>{game.home}</b>
                </td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <b>
                    {checkScore(game, scores)["away_score"] +
                      " - " +
                      checkScore(game, scores)["home_score"]}
                  </b>
                </td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {game.picks.map((pick) => {
                return (
                  <tr key={pick.player}>
                    <td
                      className={
                        checkScore(game, scores)["status"] === "Final" &&
                        Number(checkScore(game, scores)["away_score"]) >
                          Number(checkScore(game, scores)["home_score"]) &&
                        pick.pick === game.away
                          ? "Game__win"
                          : ""
                      }
                    >
                      {pick.pick === game.away ? pick.pick : ""}
                    </td>
                    <td>{pick.player}</td>
                    <td
                      className={
                        checkScore(game, scores)["status"] === "Final" &&
                        Number(checkScore(game, scores)["home_score"]) >
                          Number(checkScore(game, scores)["away_score"]) &&
                        pick.pick === game.home
                          ? "Game__win"
                          : ""
                      }
                    >
                      {pick.pick === game.home ? pick.pick : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

export default Games;
