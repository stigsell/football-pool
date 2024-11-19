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
