import React, { useState } from "react";

import {
  checkScore,
  didAwayTeamWin,
  didHomeTeamWin,
  formatTwoScores,
  getGame,
  isGameUnanimous,
} from "../utils";

function Games({ games, scores }) {
  const [showCompletedGames, setShowCompletedGames] = useState(false);
  const [showUnanimousGames, setShowUnanimousGames] = useState(false);

  const filteredByCompleted = showCompletedGames
    ? games
    : games.filter(
        (game) => !getGame(game.home, game.away, scores).status.type.completed
      );

  const filteredByUnanimousAndCompleted = showUnanimousGames
    ? filteredByCompleted
    : filteredByCompleted.filter((game) => !isGameUnanimous(game.picks));

  return (
    <>
      <h2>Games</h2>
      <div className="Filter">
        <input
          type="checkbox"
          id="showCompletedGames"
          name="showCompletedGames"
          showCompletedGames
          onChange={() => setShowCompletedGames(!showCompletedGames)}
        />
        <label for="showCompletedGames">Show Completed Games</label>
      </div>
      <div className="Filter">
        <input
          type="checkbox"
          id="showUnanimousGames"
          name="showUnanimousGames"
          showUnanimousGames
          onChange={() => setShowUnanimousGames(!showUnanimousGames)}
        />
        <label for="showUnanimousGames">Show Unanimous Games</label>
      </div>
      {filteredByUnanimousAndCompleted.map((game) => {
        const score = checkScore(game, scores);

        return (
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
                      {formatTwoScores(
                        score["away_score"],
                        score["home_score"]
                      )}
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
                          didAwayTeamWin(score) && pick.pick === game.away
                            ? "Game__win"
                            : ""
                        }
                      >
                        {pick.pick === game.away ? pick.pick : ""}
                      </td>
                      <td>{pick.player}</td>
                      <td
                        className={
                          didHomeTeamWin(score) && pick.pick === game.home
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
        );
      })}
    </>
  );
}

export default Games;
