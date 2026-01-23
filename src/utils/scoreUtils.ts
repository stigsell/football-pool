import { PLAYERS } from "./constants";
import {
  getAwayTeam,
  getHomeTeam,
  getGame,
  isGameInProgress,
  getEventStatus,
} from "./gameEventUtils";
import { formatInProgressGameClock } from "./formatUtils";
import { ESPNEvent, ESPNScoresResponse, Game, GameScore, Pick, PlayerScoreTuple } from "../types";

const calculatePlayerTotalScore = (player: string, games: Game[], scores: ESPNScoresResponse): number => {
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

const getPlayerPick = (player: string, picks: Pick[]): string =>
  picks.filter((pick) => pick.player === player)[0].pick;

const didPlayerMakeCorrectPick = (score: GameScore, pick: string, game: Game): boolean =>
  (didAwayTeamWin(score) && pick === game.away) ||
  (didHomeTeamWin(score) && pick === game.home);

export const calculateAllPlayersScores = (games: Game[], scores: ESPNScoresResponse): PlayerScoreTuple[] => {
  const allPlayersScores: Record<string, number> = {};
  for (const player of PLAYERS) {
    const playerScore = calculatePlayerTotalScore(player, games, scores);
    allPlayersScores[player] = playerScore;
  }
  const sortedScores: PlayerScoreTuple[] = [];
  for (var player in allPlayersScores) {
    sortedScores.push([player, allPlayersScores[player]]);
  }

  sortedScores.sort(function (a, b) {
    return b[1] - a[1];
  });
  return sortedScores;
};

export const didAwayTeamWin = (score: GameScore): boolean =>
  score["status"] === "Final" && score["away_score"] > score["home_score"];

export const didHomeTeamWin = (score: GameScore): boolean =>
  score["status"] === "Final" && score["home_score"] > score["away_score"];

export const getAwayScore = (event: ESPNEvent): number => Number(getAwayTeam(event)!["score"]);

export const getHomeScore = (event: ESPNEvent): number => Number(getHomeTeam(event)!["score"]);

export const checkScore = (game: Game, scores: ESPNScoresResponse): GameScore => {
  const event = getGame(game.home, game.away, scores)!;

  const result: GameScore = {
    status: isGameInProgress(event)
      ? formatInProgressGameClock(event)
      : getEventStatus(event),
    away_score: getAwayScore(event),
    home_score: getHomeScore(event),
  };
  return result;
};
