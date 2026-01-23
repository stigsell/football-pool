import { RICK_TO_ESPN, ESPN_TO_RICK } from "./constants";
import { ESPNEvent, ESPNScoresResponse, Game, Pick } from "../types";

const getEvent = (events: ESPNEvent[], espn_home: string | null, espn_away: string | null): ESPNEvent | undefined =>
  events.filter(
    (event) =>
      event.shortName === espn_away + " @ " + espn_home ||
      event.shortName === espn_away + " VS " + espn_home
  )[0];

const getEventTeams = (event: ESPNEvent): { away: string; home: string } => ({
  away: event.shortName.split(" ")[0],
  home: event.shortName.split(" ")[2],
});

const convertRickToESPN = (rick: string): string | null => {
  const match = RICK_TO_ESPN.find(([first]) => first === rick);

  return match ? match[1] : null;
};

const convertESPNToRick = (espn: string): string | null => {
  const match = ESPN_TO_RICK.find(([first]) => first === espn);

  return match ? match[1] : null;
};

const getGameFromEvent = (event: ESPNEvent, games: Game[]): Game | undefined => {
  const rick_away = convertESPNToRick(getEventTeams(event).away);
  const rick_home = convertESPNToRick(getEventTeams(event).home);
  return games.find(
    (game) => game.away === rick_away && game.home === rick_home
  );
};

export const isGameInProgress = (event: ESPNEvent): boolean =>
  event["status"]["type"]["description"] === "In Progress" ||
  event["status"]["type"]["description"] === "End of Period";

export const getEventStatus = (event: ESPNEvent): string => event["status"]["type"]["description"];

export const getAwayTeam = (event: ESPNEvent) =>
  event["competitions"][0]["competitors"].find(
    (team) => team.homeAway === "away"
  );

export const getHomeTeam = (event: ESPNEvent) =>
  event["competitions"][0]["competitors"].find(
    (team) => team.homeAway === "home"
  );

export const isGameUnanimous = (picks: Pick[]): boolean =>
  picks.every((pick) => pick.pick === picks[0]["pick"]);

export const areAllNonUnanimousGamesFinished = (scores: ESPNScoresResponse, games: Game[]): boolean => {
  const nonUnanimousEvents = scores.events.filter((event) => {
    return !isGameUnanimous(
      getGameFromEvent(
        getGame(
          convertESPNToRick(getEventTeams(event).home),
          convertESPNToRick(getEventTeams(event).away),
          scores
        )!,
        games
      )!.picks
    );
  });
  return nonUnanimousEvents.every((game) => game.status.type.completed);
};

export const areAllGamesFinished = (scores: ESPNScoresResponse, games: Game[]): boolean => {
  return scores.events.every((game) => game.status.type.completed);
};

export const getMNFGame = (scores: ESPNScoresResponse): ESPNEvent =>
  [...scores.events]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-1)[0];

export const getGame = (home: string | null, away: string | null, scores: ESPNScoresResponse): ESPNEvent | undefined => {
  const espn_home = home ? convertRickToESPN(home) : null;
  const espn_away = away ? convertRickToESPN(away) : null;
  return getEvent(scores.events, espn_home, espn_away);
};

export const getNumberOfGamesRemaining = (scores: ESPNScoresResponse): number =>
  scores.events.filter((event) => !event.status.type.completed).length;
