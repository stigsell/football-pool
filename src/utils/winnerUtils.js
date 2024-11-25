import { getAwayScore, getHomeScore } from "./scoreUtils";

export const getWinners = (allPlayersScores) => {
  const highScore = allPlayersScores[0][1];
  return allPlayersScores
    .filter((player) => player[1] === highScore)
    .map((player) => player[0]);
};

export const getTiebreakWinners = (
  mnfGame,
  winners,
  playersProjectedMNFPoints
) => {
  const totalPoints = getAwayScore(mnfGame) + getHomeScore(mnfGame);

  const distanceFromEstimatedToActualPerPlayer = {};
  for (const winner of winners) {
    const distance = Math.abs(playersProjectedMNFPoints[winner] - totalPoints);

    distanceFromEstimatedToActualPerPlayer[winner] = distance;
  }

  const smallestDistance = Math.min(
    ...Object.values(distanceFromEstimatedToActualPerPlayer)
  );

  const tiebreakerWinners = [];
  for (const winner of winners) {
    if (distanceFromEstimatedToActualPerPlayer[winner] === smallestDistance) {
      tiebreakerWinners.push(winner);
    }
  }
  return tiebreakerWinners;
};
