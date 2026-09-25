import { LATE_PICK, PLAYERS } from "./constants";
import { calculateAllPlayersScores } from "./scoreUtils";
import type { Player } from "./constants";
import type {
  ESPNScoresResponse,
  Game,
  PlayerScoreTuple,
  SeasonWeekResult,
} from "../types";

// Each player's late picks in a single week's games. A pick that missed the
// deadline is recorded as LATE_PICK, so no scores are needed to count them.
export const countLatePicks = (games: Game[]): Partial<Record<Player, number>> => {
  const latePicks: Partial<Record<Player, number>> = {};

  for (const game of games) {
    for (const { player, pick } of game.picks) {
      if (pick === LATE_PICK) latePicks[player] = (latePicks[player] ?? 0) + 1;
    }
  }

  return latePicks;
};

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

  return { week, correctPicks, latePicks: countLatePicks(games) };
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

// The recorded weeks in playing order, with their winner formatted for
// display. A week with no winner yet is left out.
export const getWeekWinners = (
  weeks: SeasonWeekResult[]
): Array<{ week: number; winner: string }> =>
  weeks
    .filter((week) => week.winners !== undefined && week.winners.length > 0)
    .sort((a, b) => a.week - b.week)
    .map((week) => ({
      week: week.week,
      // A tie the MNF points tiebreaker could not separate shares the week.
      winner: (week.winners as Player[]).join(" & "),
    }));

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

// Each player's late picks across every recorded week, most first. Players
// level on late picks stay in alphabetical order.
export const getLatePickTotals = (weeks: SeasonWeekResult[]): PlayerScoreTuple[] => {
  const totals: PlayerScoreTuple[] = PLAYERS.map((player: Player) => [
    player,
    weeks.reduce((total, week) => total + (week.latePicks?.[player] ?? 0), 0),
  ]);

  return totals.sort((a, b) =>
    a[1] === b[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]
  );
};
