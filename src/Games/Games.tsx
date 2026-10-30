import { useState } from "react";

import { getEventStatus, getGame, isGameUnanimous } from "../utils/gameEventUtils";
import {
  checkScore,
  didAwayTeamWin,
  didHomeTeamWin,
} from "../utils/scoreUtils";

import { formatTwoScores } from "../utils/formatUtils";
import { LATE_PICK } from "../utils/constants";
import { gameKey } from "../utils/simulationUtils";
import type { SimulatedWinners } from "../utils/simulationUtils";
import type { RickTeamCode } from "../utils/constants";
import type { Game, ESPNScoresResponse } from "../types";

interface GamesProps {
  games: Game[];
  scores?: ESPNScoresResponse;
  simulated?: SimulatedWinners;
  onSimulate?: (game: Game, team: RickTeamCode) => void;
  onResetSimulations?: () => void;
}

function Games({ games, scores, simulated = {}, onSimulate, onResetSimulations }: GamesProps) {
  const [showCompletedGames, setShowCompletedGames] = useState(false);
  const [showUnanimousGames, setShowUnanimousGames] = useState(false);

  if (!scores) return null;

  // A simulated game only looks finished, so it still counts as upcoming.
  const isSimulated = (game: Game) => gameKey(game) in simulated;
  const isCompleted = (game: Game) =>
    !isSimulated(game) && !!getGame(game.home, game.away, scores)?.status.type.completed;

  const completedCount = games.filter(isCompleted).length;
  const unanimousCount = games.filter((game) => isGameUnanimous(game.picks)).length;

  const filteredByCompleted = showCompletedGames
    ? games
    : games.filter((game) => !isCompleted(game));

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
        <label htmlFor="showCompletedGames">Show Completed Games ({completedCount})</label>
      </div>
      <div className="Filter">
        <input
          type="checkbox"
          id="showUnanimousGames"
          name="showUnanimousGames"
          onChange={() => setShowUnanimousGames(!showUnanimousGames)}
        />
        <label htmlFor="showUnanimousGames">Show Unanimous Games ({unanimousCount})</label>
      </div>
      {onResetSimulations && Object.keys(simulated).length > 0 ? (
        <div className="Filter Filter--centered">
          <button type="button" className="Game__team" onClick={onResetSimulations}>
            Reset simulation(s)
          </button>
        </div>
      ) : null}
      {filteredByUnanimousAndCompleted.map((game) => {
        const score = checkScore(game, scores);
        if (!score) return null;
        const event = getGame(game.home, game.away, scores);
        const simulatedWinner = simulated[gameKey(game)];
        const canSimulate = !!onSimulate && !!event && (isSimulated(game) || !event.status.type.completed);
        const teamHeader = (team: RickTeamCode) =>
          canSimulate ? (
            <button
              type="button"
              className={
                "Game__team" + (simulatedWinner === team ? " Game__team--selected" : "")
              }
              aria-pressed={simulatedWinner === team}
              title={`Simulate ${team} winning`}
              onClick={() => onSimulate(game, team)}
            >
              {team}
            </button>
          ) : (
            <b>{team}</b>
          );

        return (
          <div className="Game" key={game.home + game.away}>
            <table className="Game__table">
              <thead>
                <tr>
                  <td>{teamHeader(game.away)}</td>
                  <td>
                    <b>{simulatedWinner ? "Simulated" : score.status}</b>
                  </td>
                  <td>{teamHeader(game.home)}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>
                    <b>
                      {simulatedWinner || (event && getEventStatus(event) === "Scheduled")
                        ? ""
                        : formatTwoScores(score.away_score, score.home_score)}
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
