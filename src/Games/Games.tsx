import { useState } from "react";

import { getGame, isGameUnanimous } from "../utils/gameEventUtils";
import {
  checkScore,
  didAwayTeamWin,
  didHomeTeamWin,
} from "../utils/scoreUtils";

import { formatTwoScores } from "../utils/formatUtils";
import { LATE_PICK } from "../utils/constants";
import type { Game, ESPNScoresResponse } from "../types";

interface GamesProps {
  games: Game[];
  scores?: ESPNScoresResponse;
}

function Games({ games, scores }: GamesProps) {
  const [showCompletedGames, setShowCompletedGames] = useState(false);
  const [showUnanimousGames, setShowUnanimousGames] = useState(false);

  if (!scores) return null;

  const filteredByCompleted = showCompletedGames
    ? games
    : games.filter((game) => {
        const event = getGame(game.home, game.away, scores);
        return event ? !event.status.type.completed : true;
      });

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
          onChange={() => setShowCompletedGames(!showCompletedGames)}
        />
        <label htmlFor="showCompletedGames">Show Completed Games</label>
      </div>
      <div className="Filter">
        <input
          type="checkbox"
          id="showUnanimousGames"
          name="showUnanimousGames"
          onChange={() => setShowUnanimousGames(!showUnanimousGames)}
        />
        <label htmlFor="showUnanimousGames">Show Unanimous Games</label>
      </div>
      {filteredByUnanimousAndCompleted.map((game) => {
        const score = checkScore(game, scores);
        if (!score) return null;

        return (
          <div className="Game" key={game.home + game.away}>
            <table className="Game__table">
              <thead>
                <tr>
                  <td>
                    <b>{game.away}</b>
                  </td>
                  <td>
                    <b>{score.status}</b>
                  </td>
                  <td>
                    <b>{game.home}</b>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>
                    <b>
                      {formatTwoScores(score.away_score, score.home_score)}
                    </b>
                  </td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {game.picks.map((pick) => {
                  // A late pick belongs to neither team, so it shows next to
                  // the player instead of in a team column — and it's already
                  // a loss whatever the score ends up being.
                  const isLatePick = pick.pick === LATE_PICK;

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
                      <td className={isLatePick ? "Game__lose" : ""}>
                        {isLatePick
                          ? `${pick.player} (${LATE_PICK})`
                          : pick.player}
                      </td>
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
