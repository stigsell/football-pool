import { getAwayScore, getHomeScore, calculateAllPlayersScores } from "./scoreUtils";
import { getRemainingGames } from "./gameEventUtils";
import { LATE_PICK } from "./constants";
import type { Player, PlayerPick } from "./constants";
import type {
  ESPNEvent,
  ESPNScoresResponse,
  Game,
  PlayerScoreTuple,
  PlayersProjectedMNFPoints,
} from "../types";

export const getWinners = (allPlayersScores: PlayerScoreTuple[]): Player[] => {
  const highScore = allPlayersScores[0][1];
  return allPlayersScores
    .filter((player) => player[1] === highScore)
    .map((player) => player[0]);
};

export const getTiebreakWinners = (
  mnfGame: ESPNEvent,
  winners: Player[],
  playersProjectedMNFPoints: PlayersProjectedMNFPoints
): Player[] => {
  const totalPoints = getAwayScore(mnfGame) + getHomeScore(mnfGame);

  const distanceFromEstimatedToActualPerPlayer: Record<string, number> = {};
  for (const winner of winners) {
    const projected = playersProjectedMNFPoints[winner];
    if (projected === undefined) continue;
    const distance = Math.abs(projected - totalPoints);
    distanceFromEstimatedToActualPerPlayer[winner] = distance;
  }

  const distances = Object.values(distanceFromEstimatedToActualPerPlayer);
  if (distances.length === 0) return winners;

  const smallestDistance = Math.min(...distances);

  const tiebreakerWinners: Player[] = [];
  for (const winner of winners) {
    if (distanceFromEstimatedToActualPerPlayer[winner] === smallestDistance) {
      tiebreakerWinners.push(winner);
    }
  }
  return tiebreakerWinners;
};

// A late pick is recorded but can never be correct, so it wins the player nothing.
const getWinnablePick = (player: Player, game: Game): PlayerPick | undefined => {
  const pick = game.picks.find((p) => p.player === player)?.pick;
  return pick === undefined || pick === LATE_PICK ? undefined : pick;
};

/**
 * Whether any outcome of the unfinished games still leaves `player` level with
 * or ahead of every rival. A tie for the lead counts, since the MNF points
 * tiebreaker decides those.
 *
 * The best case for `player` is every remaining game landing on their own pick:
 * that maximizes their score, and against each rival simultaneously it is the
 * rival's worst case, because a rival only gains on games where they picked the
 * same team. So one pass over the rivals settles it, with no need to enumerate
 * outcomes.
 *
 * Games the player never picked (or picked late) are the one soft spot: the
 * outcome that hurts one rival may help another, so each rival is measured
 * against the outcome that hurts them most. That errs toward keeping a player
 * alive, never toward eliminating them wrongly.
 */
const canPlayerStillWin = (
  player: Player,
  allPlayersScores: PlayerScoreTuple[],
  remainingGames: Game[]
): boolean => {
  const scoreOf = (target: Player): number =>
    allPlayersScores.find((score) => score[0] === target)?.[1] ?? 0;

  const winnablePicks = remainingGames
    .map((game) => ({ game, pick: getWinnablePick(player, game) }))
    .filter((entry) => entry.pick !== undefined);

  const bestCase = scoreOf(player) + winnablePicks.length;

  return allPlayersScores.every(([rival, rivalScore]) => {
    if (rival === player) return true;

    const rivalGains = winnablePicks.filter(
      ({ game, pick }) => getWinnablePick(rival, game) === pick
    ).length;

    return rivalScore + rivalGains <= bestCase;
  });
};

export const getEliminatedPlayers = (
  games?: Game[],
  scores?: ESPNScoresResponse
): Player[] => {
  if (!games || !scores) return [];

  const allPlayersScores = calculateAllPlayersScores(games, scores);
  const remainingGames = getRemainingGames(games, scores);

  return allPlayersScores
    .filter((score) => !canPlayerStillWin(score[0], allPlayersScores, remainingGames))
    .map((score) => score[0]);
};
