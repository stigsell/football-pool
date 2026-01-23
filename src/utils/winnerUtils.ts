import { getAwayScore, getHomeScore } from "./scoreUtils";
import { ESPNEvent, PlayerScoreTuple, PlayersProjectedMNFPoints } from "../types";

export const getWinners = (allPlayersScores: PlayerScoreTuple[]): string[] => {
  const highScore = allPlayersScores[0][1];
  return allPlayersScores
    .filter((player) => player[1] === highScore)
    .map((player) => player[0]);
};

export const getTiebreakWinners = (
  mnfGame: ESPNEvent,
  winners: string[],
  playersProjectedMNFPoints: PlayersProjectedMNFPoints
): string[] => {
  const totalPoints = getAwayScore(mnfGame) + getHomeScore(mnfGame);

  const distanceFromEstimatedToActualPerPlayer: Record<string, number> = {};
  for (const winner of winners) {
    const distance = Math.abs(playersProjectedMNFPoints[winner] - totalPoints);

    distanceFromEstimatedToActualPerPlayer[winner] = distance;
  }

  const smallestDistance = Math.min(
    ...Object.values(distanceFromEstimatedToActualPerPlayer)
  );

  const tiebreakerWinners: string[] = [];
  for (const winner of winners) {
    if (distanceFromEstimatedToActualPerPlayer[winner] === smallestDistance) {
      tiebreakerWinners.push(winner);
    }
  }
  return tiebreakerWinners;
};

export const isPlayerEliminated = (highScore: number, playerScore: number, numGamesRemaining: number): boolean =>
  highScore - playerScore > numGamesRemaining;
