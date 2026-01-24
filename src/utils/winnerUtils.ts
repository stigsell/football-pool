import { getAwayScore, getHomeScore } from "./scoreUtils";
import type { Player } from "./constants";
import type { ESPNEvent, PlayerScoreTuple, PlayersProjectedMNFPoints } from "../types";

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

export const isPlayerEliminated = (highScore: number, playerScore: number, numGamesRemaining: number): boolean =>
  highScore - playerScore > numGamesRemaining;
