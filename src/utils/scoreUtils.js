import { PLAYERS } from "./constants";
import {
  getAwayTeam,
  getHomeTeam,
  getGame,
  isGameInProgress,
  getEventStatus,
} from "./gameEventUtils";
import { formatInProgressGameClock } from "./formatUtils";

const calculatePlayerTotalScore = (player, games, scores) => {
  let playerScore = 0;
  for (const game of games) {
    const score = checkScore(game, scores);
    const pick = getPlayerPick(player, game.picks);
    if (didPlayerMakeCorrectPick(score, pick, game)) {
      playerScore++;
    }
  }
  return playerScore;
};

const getPlayerPick = (player, picks) =>
  picks.filter((pick) => pick.player === player)[0].pick;

const didPlayerMakeCorrectPick = (score, pick, game) =>
  (didAwayTeamWin(score) && pick === game.away) ||
  (didHomeTeamWin(score) && pick === game.home);

export const calculateAllPlayersScores = (games, scores) => {
  const allPlayersScores = {};
  for (const player of PLAYERS) {
    const playerScore = calculatePlayerTotalScore(player, games, scores);
    allPlayersScores[player] = playerScore;
  }
  const sortedScores = [];
  for (var player in allPlayersScores) {
    sortedScores.push([player, allPlayersScores[player]]);
  }

  sortedScores.sort(function (a, b) {
    return b[1] - a[1];
  });
  return sortedScores;
};

export const didAwayTeamWin = (score) =>
  score["status"] === "Final" && score["away_score"] > score["home_score"];

export const didHomeTeamWin = (score) =>
  score["status"] === "Final" && score["home_score"] > score["away_score"];

export const getAwayScore = (event) => Number(getAwayTeam(event)["score"]);

export const getHomeScore = (event) => Number(getHomeTeam(event)["score"]);

export const checkScore = (game, scores) => {
  const event = getGame(game.home, game.away, scores);

  const result = {
    status: isGameInProgress(event)
      ? formatInProgressGameClock(event)
      : getEventStatus(event),
    away_score: getAwayScore(event),
    home_score: getHomeScore(event),
  };
  return result;
};
