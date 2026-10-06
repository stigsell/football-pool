import { RICK_TO_ESPN_MAP } from "./constants";
import type { RickTeamCode, ESPNTeamCode } from "./constants";
import type { ESPNEvent, ESPNScoresResponse, Game, Pick, Competitor } from "../types";

const getEvent = (events: ESPNEvent[], espn_home: ESPNTeamCode | undefined, espn_away: ESPNTeamCode | undefined): ESPNEvent | undefined =>
  events.find(
    (event) =>
      event.shortName === espn_away + " @ " + espn_home ||
      event.shortName === espn_away + " VS " + espn_home
  );

const convertRickToESPN = (rick: RickTeamCode): ESPNTeamCode | undefined => {
  return RICK_TO_ESPN_MAP.get(rick);
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

// The pool's own games that have not finished yet. Driven by the games list
// rather than the ESPN slate, so games the spreadsheet leaves out never count.
export const getRemainingGames = (games: Game[], scores: ESPNScoresResponse): Game[] =>
  games.filter((game) => {
    const event = getGame(game.home, game.away, scores);
    if (!event) return false;
    return !event.status.type.completed;
  });
