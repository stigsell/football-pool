import { RICK_TO_ESPN, ESPN_TO_RICK, PLAYERS } from "./constants";

export const getEvent = (events, espn_home, espn_away) =>
  events.filter(
    (event) =>
      event.shortName === espn_away + " @ " + espn_home ||
      event.shortName === espn_away + " VS " + espn_home
  )[0];

export const getEventTeams = (event) => ({
  away: event.shortName.split(" ")[0],
  home: event.shortName.split(" ")[2],
});

export const convertRickToESPN = (rick) => {
  const match = RICK_TO_ESPN.find(([first]) => first === rick);

  return match ? match[1] : null;
};

export const convertESPNToRick = (espn) => {
  const match = ESPN_TO_RICK.find(([first]) => first === espn);

  return match ? match[1] : null;
};

export const getGame = (home, away, scores) => {
  const espn_home = convertRickToESPN(home);
  const espn_away = convertRickToESPN(away);
  return getEvent(scores.events, espn_home, espn_away);
};

export const getGameFromEvent = (event, games) => {
  const rick_away = convertESPNToRick(getEventTeams(event).away);
  const rick_home = convertESPNToRick(getEventTeams(event).home);
  return games.find(
    (game) => game.away === rick_away && game.home === rick_home
  );
};

export const isGameInProgress = (event) =>
  event["status"]["type"]["description"] === "In Progress" ||
  event["status"]["type"]["description"] === "End of Period";

export const formatInProgressGameClock = (event) =>
  "Q" + event["status"]["period"] + " " + event["status"]["displayClock"];

export const getEventStatus = (event) => event["status"]["type"]["description"];

export const getAwayTeam = (event) =>
  event["competitions"][0]["competitors"].find(
    (team) => team.homeAway === "away"
  );

export const getHomeTeam = (event) =>
  event["competitions"][0]["competitors"].find(
    (team) => team.homeAway === "home"
  );

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

export const formatTwoScores = (away_score, home_score) =>
  away_score + " - " + home_score;

export const didAwayTeamWin = (score) =>
  score["status"] === "Final" && score["away_score"] > score["home_score"];

export const didHomeTeamWin = (score) =>
  score["status"] === "Final" && score["home_score"] > score["away_score"];

export const getPlayerPick = (player, picks) =>
  picks.filter((pick) => pick.player === player)[0].pick;

export const didPlayerMakeCorrectPick = (score, pick, game) =>
  (didAwayTeamWin(score) && pick === game.away) ||
  (didHomeTeamWin(score) && pick === game.home);

export const calculatePlayerTotalScore = (player, games, scores) => {
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

export const areAllGamesFinished = (scores) =>
  scores.events.every((game) => game.status.type.completed);

export const isGameUnanimous = (picks) =>
  picks.every((pick) => pick.pick === picks[0]["pick"]);

export const areAllNonUnanimousGamesFinished = (scores, games) => {
  const nonUnanimousEvents = scores.events.filter((event) => {
    return !isGameUnanimous(
      getGameFromEvent(
        getGame(
          convertESPNToRick(getEventTeams(event).home),
          convertESPNToRick(getEventTeams(event).away),
          scores
        ),
        games
      ).picks
    );
  });
  return nonUnanimousEvents.every((game) => game.status.type.completed);
};

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
export const getMNFGame = (scores) => scores.events.slice(-1)[0];
