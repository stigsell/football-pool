import { RICK_TO_ESPN, ESPN_TO_RICK } from "../constants";

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

export const getEventStatus = (event) => event["status"]["type"]["description"];

export const getAwayTeam = (event) =>
  event["competitions"][0]["competitors"].find(
    (team) => team.homeAway === "away"
  );

export const getHomeTeam = (event) =>
  event["competitions"][0]["competitors"].find(
    (team) => team.homeAway === "home"
  );

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

export const getMNFGame = (scores) => scores.events.slice(-1)[0];
