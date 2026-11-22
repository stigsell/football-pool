import { LATE_PICK, PLAYERS, SEASON_BUY_IN, WEEKLY_PAYOUT } from "./constants";
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

// The key a pair of players is stored under in `samePicks`: their names in
// PLAYERS order joined by "|", so a pair has one key whichever player is first.
export const pairKey = (a: Player, b: Player): string =>
  PLAYERS.indexOf(a) <= PLAYERS.indexOf(b) ? `${a}|${b}` : `${b}|${a}`;

// For each pair of players, how many of a single week's games they picked the
// same team in. A late pick is not a pick, so it never agrees with anything.
export const countSamePicks = (games: Game[]): Record<string, number> => {
  const samePicks: Record<string, number> = {};

  for (const game of games) {
    const valid = game.picks.filter(({ pick }) => pick !== LATE_PICK);
    valid.forEach((first, index) => {
      for (const second of valid.slice(index + 1)) {
        if (first.pick !== second.pick) continue;
        const key = pairKey(first.player, second.player);
        samePicks[key] = (samePicks[key] ?? 0) + 1;
      }
    });
  }

  return samePicks;
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

  return {
    week,
    correctPicks,
    latePicks: countLatePicks(games),
    samePicks: countSamePicks(games),
  };
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
      winner: (week.winners as Player[]).join(", "),
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

// Each player's season money: weekly winnings (a tied week splits the payout
// evenly) and the net after the buy-in. Biggest winner first; players level on
// winnings stay in alphabetical order.
export const getSeasonEarnings = (
  weeks: SeasonWeekResult[]
): Array<{ player: Player; winnings: number; net: number }> => {
  const earnings = PLAYERS.map((player: Player) => {
    const winnings = weeks.reduce((total, week) => {
      const winners = week.winners ?? [];
      return winners.includes(player)
        ? total + WEEKLY_PAYOUT / winners.length
        : total;
    }, 0);
    return { player, winnings, net: winnings - SEASON_BUY_IN };
  });

  return earnings.sort((a, b) =>
    a.winnings === b.winnings
      ? a.player.localeCompare(b.player)
      : b.winnings - a.winnings
  );
};

export interface WeekRecord {
  week: number;
  correct: number;
  players: Player[];
}

// The week(s) holding the highest (or lowest) correct pick count by any one
// player, in playing order. Players who share a score in the same week are
// grouped, and the same score in another week gets its own record. Only
// players with a recorded score that week count.
const getExtremeWeeks = (
  weeks: SeasonWeekResult[],
  pick: (a: number, b: number) => number
): WeekRecord[] => {
  const entries = weeks.flatMap((week) =>
    PLAYERS.filter((player) => week.correctPicks[player] !== undefined).map(
      (player) => ({ week: week.week, player, correct: week.correctPicks[player] as number })
    )
  );
  if (entries.length === 0) return [];

  const extreme = entries.map((entry) => entry.correct).reduce((a, b) => pick(a, b));

  return weeks
    .map((week) => week.week)
    .sort((a, b) => a - b)
    .map((weekNum) => ({
      week: weekNum,
      correct: extreme,
      players: entries
        .filter((entry) => entry.week === weekNum && entry.correct === extreme)
        .map((entry) => entry.player),
    }))
    .filter((record) => record.players.length > 0);
};

export const getBestWeeks = (weeks: SeasonWeekResult[]): WeekRecord[] =>
  getExtremeWeeks(weeks, Math.max);

export const getWorstWeeks = (weeks: SeasonWeekResult[]): WeekRecord[] =>
  getExtremeWeeks(weeks, Math.min);

export interface AlikePair {
  players: [Player, Player];
  count: number;
}

// The pair(s) of players who picked the same team most often across the
// season, in PLAYERS order when level. Nothing is returned until some pair has
// agreed at least once.
export const getMostAlikePairs = (weeks: SeasonWeekResult[]): AlikePair[] => {
  const totals: Record<string, number> = {};
  for (const week of weeks) {
    for (const [key, count] of Object.entries(week.samePicks ?? {})) {
      totals[key] = (totals[key] ?? 0) + count;
    }
  }

  const most = Math.max(0, ...Object.values(totals));
  if (most === 0) return [];

  return PLAYERS.flatMap((first, index) =>
    PLAYERS.slice(index + 1).map((second): AlikePair => ({
      players: [first, second],
      count: totals[pairKey(first, second)] ?? 0,
    }))
  ).filter(({ count }) => count === most);
};
