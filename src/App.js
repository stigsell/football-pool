import React, { useState, useEffect } from "react";
import { readFile, parseFile } from "./ParseXLS";
import { PLAYERS, RICK_TO_ESPN } from "./constants";
import "./App.css";

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
    (event) => event.shortName === espn_away + " @ " + espn_home
  )[0];
  const result = {
    status: event["status"]["type"]["description"],
    away_score: event["competitions"][0]["competitors"][1]["score"],
    home_score: event["competitions"][0]["competitors"][0]["score"], // TODO are they always in this order?
  };
  return result;
};

function App() {
  const [inputFile, setInputFile] = useState(null);
  const [games, setGames] = useState([]);
  const [scores, setScores] = useState([]);
  const [adamScore, setAdamScore] = useState(0);
  const [alexScore, setAlexScore] = useState(0);
  const [benScore, setBenScore] = useState(0);
  const [connorScore, setConnorScore] = useState(0);
  const [kyleeScore, setKyleeScore] = useState(0);
  const [nickScore, setNickScore] = useState(0);
  const [noahScore, setNoahScore] = useState(0);
  const [rickScore, setRickScore] = useState(0);
  const [rickyScore, setRickyScore] = useState(0);
  const [tammyScore, setTammyScore] = useState(0);

  useEffect(() => {
    fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2024&seasontype=2&week=11"
    ) // TODO don't hardcode week
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setScores(data);
      });
  }, []);

  async function handleChange(event) {
    const file = event.target.files[0];
    setInputFile(file);
    console.log(file);
    const json_file = await readFile(file);
    console.log("json_file", json_file);
    const games = parseFile(json_file);
    setGames(games);
    console.log("games", games);
    setAdamScore(calculatePlayerTotalScore("Adam", games, scores));
    setAlexScore(calculatePlayerTotalScore("Alex", games, scores));
    setBenScore(calculatePlayerTotalScore("Ben", games, scores));
    setConnorScore(calculatePlayerTotalScore("Connor", games, scores));
    setKyleeScore(calculatePlayerTotalScore("Kylee", games, scores));
    setNickScore(calculatePlayerTotalScore("Nick", games, scores));
    setNoahScore(calculatePlayerTotalScore("Noah", games, scores));
    setRickScore(calculatePlayerTotalScore("Rick", games, scores));
    setRickyScore(calculatePlayerTotalScore("Ricky", games, scores));
    setTammyScore(calculatePlayerTotalScore("Tammy", games, scores));
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Siegl Football Pool</h1>
      </header>
      <body>
        <form>
          <input type="file" onChange={handleChange} />
        </form>
        {inputFile === null && <p>Upload file to see results</p>}
        {inputFile !== null && (
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
                    <td>{adamScore}</td>
                  </tr>
                  <tr>
                    <td>{"Alex"}</td>
                    <td>{alexScore}</td>
                  </tr>
                  <tr>
                    <td>{"Ben"}</td>
                    <td>{benScore}</td>
                  </tr>
                  <tr>
                    <td>{"Connor"}</td>
                    <td>{connorScore}</td>
                  </tr>
                  <tr>
                    <td>{"Kylee"}</td>
                    <td>{kyleeScore}</td>
                  </tr>
                  <tr>
                    <td>{"Nick"}</td>
                    <td>{nickScore}</td>
                  </tr>
                  <tr>
                    <td>{"Noah"}</td>
                    <td>{noahScore}</td>
                  </tr>
                  <tr>
                    <td>{"Rick"}</td>
                    <td>{rickScore}</td>
                  </tr>
                  <tr>
                    <td>{"Ricky"}</td>
                    <td>{rickyScore}</td>
                  </tr>
                  <tr>
                    <td>{"Tammy"}</td>
                    <td>{tammyScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h2>Games</h2>
            {games.map((game) => (
              <div className="Game">
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
                        <tr>
                          <td
                            className={
                              checkScore(game, scores)["status"] === "Final" &&
                              Number(checkScore(game, scores)["away_score"]) >
                                Number(
                                  checkScore(game, scores)["home_score"]
                                ) &&
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
                                Number(
                                  checkScore(game, scores)["away_score"]
                                ) &&
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
        )}
      </body>
    </div>
  );
}

export default App;
