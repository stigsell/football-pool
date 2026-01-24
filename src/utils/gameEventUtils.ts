import { RICK_TO_ESPN_MAP, ESPN_TO_RICK_MAP, RickTeamCode, ESPNTeamCode } from "./constants";
import { ESPNEvent, ESPNScoresResponse, Game, Pick, Competitor } from "../types";

const getEvent = (events: ESPNEvent[], espn_home: ESPNTeamCode | undefined, espn_away: ESPNTeamCode | undefined): ESPNEvent | undefined =>
  events.find(
    (event) =>
      event.shortName === espn_away + " @ " + espn_home ||
      event.shortName === espn_away + " VS " + espn_home
  );

const getEventTeams = (event: ESPNEvent): { away: string; home: string } => ({
  away: event.shortName.split(" ")[0],
  home: event.shortName.split(" ")[2],
});

const convertRickToESPN = (rick: RickTeamCode): ESPNTeamCode | undefined => {
  return RICK_TO_ESPN_MAP.get(rick);
};

const convertESPNToRick = (espn: string): RickTeamCode | undefined => {
  return ESPN_TO_RICK_MAP.get(espn as ESPNTeamCode);
};

const getGameFromEvent = (event: ESPNEvent, games: Game[]): Game | undefined => {
  const rick_away = convertESPNToRick(getEventTeams(event).away);
  const rick_home = convertESPNToRick(getEventTeams(event).home);
  // istanbul ignore next -- defensive check; team codes are validated before this function is called
  if (!rick_away || !rick_home) return undefined;
  return games.find(
    (game) => game.away === rick_away && game.home === rick_home
  );
};

export const isGameInProgress = (event: ESPNEvent): boolean =>
  event.status.type.description === "In Progress" ||
  event.status.type.description === "End of Period";

export const getEventStatus = (event: ESPNEvent): string => event.status.type.description;

export const getAwayTeam = (event: ESPNEvent): Competitor | undefined =>
  event.competitions[0].competitors.find(
    (team) => team.homeAway === "away"
  );

export const getHomeTeam = (event: ESPNEvent): Competitor | undefined =>
  event.competitions[0].competitors.find(
    (team) => team.homeAway === "home"
  );

export const isGameUnanimous = (picks: Pick[]): boolean =>
  picks.every((pick) => pick.pick === picks[0].pick);

export const areAllNonUnanimousGamesFinished = (scores: ESPNScoresResponse, games: Game[]): boolean => {
  const nonUnanimousEvents = scores.events.filter((event) => {
    const eventTeams = getEventTeams(event);
    const rickHome = convertESPNToRick(eventTeams.home);
    const rickAway = convertESPNToRick(eventTeams.away);
    if (!rickHome || !rickAway) return false;

    const matchedEvent = getGame(rickHome, rickAway, scores);
    // istanbul ignore next -- matchedEvent will always be found since we're iterating the same scores array
    if (!matchedEvent) return false;

    const game = getGameFromEvent(matchedEvent, games);
    if (!game) return false;

    return !isGameUnanimous(game.picks);
  });
  return nonUnanimousEvents.every((game) => game.status.type.completed);
};

export const areAllGamesFinished = (scores: ESPNScoresResponse, _games: Game[]): boolean => {
  return scores.events.every((game) => game.status.type.completed);
};

export const getMNFGame = (scores: ESPNScoresResponse): ESPNEvent | undefined => {
  if (scores.events.length === 0) return undefined;
  return [...scores.events]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-1)[0];
};

export const getGame = (home: RickTeamCode, away: RickTeamCode, scores: ESPNScoresResponse): ESPNEvent | undefined => {
  const espn_home = convertRickToESPN(home);
  const espn_away = convertRickToESPN(away);
  return getEvent(scores.events, espn_home, espn_away);
};

export const getNumberOfGamesRemaining = (scores: ESPNScoresResponse): number =>
  scores.events.filter((event) => !event.status.type.completed).length;
