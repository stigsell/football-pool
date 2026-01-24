import { PLAYERS } from "./constants";
import type { Player } from "./constants";
import {
  getAwayTeam,
  getHomeTeam,
  getGame,
  isGameInProgress,
  getEventStatus,
} from "./gameEventUtils";
import { formatInProgressGameClock } from "./formatUtils";
import type { ESPNEvent, ESPNScoresResponse, Game, GameScore, Pick, PlayerScoreTuple } from "../types";

const calculatePlayerTotalScore = (player: Player, games: Game[], scores: ESPNScoresResponse): number => {
  let playerScore = 0;
  for (const game of games) {
    const score = checkScore(game, scores);
    if (!score) continue;
    const pick = getPlayerPick(player, game.picks);
    if (pick && didPlayerMakeCorrectPick(score, pick, game)) {
      playerScore++;
    }
  }
  return playerScore;
};

const getPlayerPick = (player: Player, picks: Pick[]): Pick | undefined =>
  picks.find((pick) => pick.player === player);

const didPlayerMakeCorrectPick = (score: GameScore, pick: Pick, game: Game): boolean =>
  (didAwayTeamWin(score) && pick.pick === game.away) ||
  (didHomeTeamWin(score) && pick.pick === game.home);

export const calculateAllPlayersScores = (games: Game[], scores: ESPNScoresResponse): PlayerScoreTuple[] => {
  const allPlayersScores: Record<Player, number> = {} as Record<Player, number>;
  for (const player of PLAYERS) {
    const playerScore = calculatePlayerTotalScore(player, games, scores);
    allPlayersScores[player] = playerScore;
  }
  const sortedScores: PlayerScoreTuple[] = [];
  for (const player of PLAYERS) {
    sortedScores.push([player, allPlayersScores[player]]);
  }

  sortedScores.sort((a, b) => b[1] - a[1]);
  return sortedScores;
};

export const didAwayTeamWin = (score: GameScore): boolean =>
  score.status === "Final" && score.away_score > score.home_score;

export const didHomeTeamWin = (score: GameScore): boolean =>
  score.status === "Final" && score.home_score > score.away_score;

export const getAwayScore = (event: ESPNEvent): number => {
  const awayTeam = getAwayTeam(event);
  return awayTeam ? Number(awayTeam.score) : 0;
};

export const getHomeScore = (event: ESPNEvent): number => {
  const homeTeam = getHomeTeam(event);
  return homeTeam ? Number(homeTeam.score) : 0;
};

export const checkScore = (game: Game, scores: ESPNScoresResponse): GameScore | undefined => {
  const event = getGame(game.home, game.away, scores);
  if (!event) return undefined;

  return {
    status: isGameInProgress(event)
      ? formatInProgressGameClock(event)
      : getEventStatus(event),
    away_score: getAwayScore(event),
    home_score: getHomeScore(event),
  };
};
