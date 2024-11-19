import React from "react";
import { RICK_TO_ESPN } from "../constants";

export const convertRickToESPN = (rick) => {
  // Find the array where the first element matches the given value
  const match = RICK_TO_ESPN.find(([first]) => first === rick);

  // If match is found, return the second value, otherwise return null
  return match ? match[1] : null;
};

export const checkScore = (game, scores) => {
  const espn_home = convertRickToESPN(game.home);
  const espn_away = convertRickToESPN(game.away);
  const event = scores.events.filter(
    (event) =>
      event.shortName === espn_away + " @ " + espn_home ||
      event.shortName === espn_away + " VS " + espn_home
  )[0];
  const result = {
    status:
      event["status"]["type"]["description"] === "In Progress" ||
      event["status"]["type"]["description"] === "End of Period"
        ? "Q" +
          event["status"]["period"] +
          " " +
          event["status"]["displayClock"]
        : event["status"]["type"]["description"],
    away_score: event["competitions"][0]["competitors"][1]["score"],
    home_score: event["competitions"][0]["competitors"][0]["score"], // TODO are they always in this order?
  };
  return result;
};

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
