import { RICK_TO_ESPN } from "./constants";

export const getEvent = (events, espn_home, espn_away) =>
  events.filter(
    (event) =>
      event.shortName === espn_away + " @ " + espn_home ||
      event.shortName === espn_away + " VS " + espn_home
  )[0];

export const convertRickToESPN = (rick) => {
  const match = RICK_TO_ESPN.find(([first]) => first === rick);

  return match ? match[1] : null;
};

export const isGameInProgress = (event) =>
  event["status"]["type"]["description"] === "In Progress" ||
  event["status"]["type"]["description"] === "End of Period";

export const formatInProgressGameClock = (event) =>
  "Q" + event["status"]["period"] + " " + event["status"]["displayClock"];

export const getEventStatus = (event) => event["status"]["type"]["description"];

export const getAwayScore = (event) =>
  event["competitions"][0]["competitors"][1]["score"];
// TODO are they always in this order?
export const getHomeScore = (event) =>
  event["competitions"][0]["competitors"][0]["score"];

export const checkScore = (game, scores) => {
  const espn_home = convertRickToESPN(game.home);
  const espn_away = convertRickToESPN(game.away);
  const event = getEvent(scores.events, espn_home, espn_away);
  const result = {
    status: isGameInProgress(event)
      ? formatInProgressGameClock(event)
      : getEventStatus(event),
    away_score: getAwayScore(event),
    home_score: getHomeScore(event),
  };
  return result;
};
