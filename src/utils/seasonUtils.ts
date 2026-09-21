import { PLAYERS } from "./constants";
import { calculateAllPlayersScores } from "./scoreUtils";
import type { Player } from "./constants";
import type {
  ESPNScoresResponse,
  Game,
  PlayerScoreTuple,
  SeasonWeekResult,
} from "../types";

// The week currently being played, scored from the live ESPN results so the
// season totals move as games finish.
export const getLiveWeekResult = (
  week?: number,
  games?: Game[],
  scores?: ESPNScoresResponse
): SeasonWeekResult | undefined => {
  if (!week || !games || !scores || games.length === 0) return undefined;

  const correctPicks: Partial<Record<Player, number>> = {};
  for (const [player, score] of calculateAllPlayersScores(games, scores)) {
    correctPicks[player] = score;
  }

  return { week, correctPicks };
};

// Recorded weeks win: once a week lands in seasonResults.json its live scores
// are ignored, so a finished week is never counted twice.
export const withLiveWeek = (
  weeks: SeasonWeekResult[],
  liveWeek?: SeasonWeekResult
): SeasonWeekResult[] => {
  if (!liveWeek) return weeks;
  if (weeks.some((week) => week.week === liveWeek.week)) return weeks;
  return [...weeks, liveWeek];
};

// Each player's correct picks across every recorded week, highest first.
// Players level on the season stay in alphabetical order.
export const getSeasonTotals = (weeks: SeasonWeekResult[]): PlayerScoreTuple[] => {
  const totals: PlayerScoreTuple[] = PLAYERS.map((player: Player) => [
    player,
    weeks.reduce((total, week) => total + (week.correctPicks[player] ?? 0), 0),
  ]);

  return totals.sort((a, b) =>
    a[1] === b[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]
  );
};
