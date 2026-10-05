import { PLAYERS, LATE_PICK } from "./constants";
import type { Player, RickTeamCode } from "./constants";
import { calculateAllPlayersScores, getAwayScore, getHomeScore } from "./scoreUtils";
import { getGame, getMNFGame, getRemainingGames } from "./gameEventUtils";
import { getWinners, getTiebreakWinnersForTotal } from "./winnerUtils";
import type { ESPNScoresResponse, Game, PlayersProjectedMNFPoints } from "../types";

// What must happen ("ATL wins and total points are 41–43") and what it gets
// the player ("win outright" or "split with Rick").
export interface WinNeed {
  condition: string;
  result: string;
}

export interface WinScenario {
  player: Player;
  // Each way the player can win, any one of which is enough.
  needs: WinNeed[];
}

// One way a player can win: the teams that must win, the range of MNF total
// points it holds for (absent when the total does not matter), and who the
// win is split with (empty for an outright win).
interface WinCondition {
  teams: RickTeamCode[];
  totalRange?: string;
  splitWith: Player[];
}

// Every way the given games can finish, as the winning team of each game in
// order. NFL ties are rare enough to leave out.
const getOutcomes = (games: Game[]): RickTeamCode[][] =>
  games.reduce<RickTeamCode[][]>(
    (outcomes, game) =>
      outcomes.flatMap((outcome) => [
        [...outcome, game.away],
        [...outcome, game.home],
      ]),
    [[]]
  );

// Drops each game whose result does not matter to a set of outcomes (both of
// its results appear with everything else the same), then lists what is left.
const simplifyOutcomes = (games: Game[], outcomes: RickTeamCode[][]): RickTeamCode[][] => {
  let remaining = outcomes.map((outcome) => [...outcome] as (RickTeamCode | null)[]);
  games.forEach((game, i) => {
    const key = (outcome: (RickTeamCode | null)[], team: RickTeamCode | null) =>
      JSON.stringify(outcome.map((t, j) => (j === i ? team : t)));
    const present = new Set(remaining.map((outcome) => JSON.stringify(outcome)));
    const irrelevant = remaining.every(
      (outcome) =>
        present.has(key(outcome, game.away)) && present.has(key(outcome, game.home))
    );
    if (!irrelevant) return;
    const seen = new Set<string>();
    remaining = remaining
      .map((outcome) => outcome.map((t, j) => (j === i ? null : t)))
      .filter((outcome) => {
        const k = JSON.stringify(outcome);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
  });
  return remaining.map((outcome) => outcome.filter((t): t is RickTeamCode => t !== null));
};

const joinList = (items: string[]): string => {
  if (items.length <= 2) return items.join(" and ");
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
};

const formatRange = (low: number, high: number, minTotal: number, maxTotal: number): string | undefined => {
  if (low === minTotal && high === maxTotal) return undefined;
  if (high === maxTotal) return "≥ " + low;
  if (low === high) return "exactly " + low;
  if (low === minTotal) return "≤ " + high;
  return low + "–" + high;
};

const formatCondition = ({ teams, totalRange }: WinCondition): string => {
  const parts = teams.map((team) => team + " wins");
  if (totalRange) parts.push("total points are " + totalRange);
  return parts.length === 0 ? "any result" : joinList(parts);
};

// One line per condition, each with who the win is split with. Conditions
// with the same split are kept next to each other.
const formatNeeds = (conditions: WinCondition[]): WinNeed[] => {
  const groups = new Map<string, WinCondition[]>();
  for (const condition of conditions) {
    const key = condition.splitWith.join(",");
    groups.set(key, [...(groups.get(key) ?? []), condition]);
  }
  return Array.from(groups.values())
    .flat()
    .map((condition) => ({
      condition: formatCondition(condition),
      result:
        condition.splitWith.length === 0
          ? "win outright"
          : "split with " + joinList(condition.splitWith),
    }));
};

/**
 * For every player who can still win the week, the results of the remaining
 * games (and the MNF total points, when the tiebreaker is still undecided)
 * that make them a winner.
 *
 * Every outcome of the remaining games is tried against every MNF total from
 * the points already scored up to one past the highest projection, beyond
 * which the tiebreaker can no longer change. Runs of totals with the same
 * result are merged into ranges.
 */
export const getWinScenarios = (
  games: Game[],
  scores: ESPNScoresResponse,
  playersProjectedMNFPoints: PlayersProjectedMNFPoints
): WinScenario[] => {
  const remainingGames = getRemainingGames(games, scores);
  const baseScores = calculateAllPlayersScores(games, scores);

  const mnfEvent = getMNFGame(scores);
  const tiebreakGame = remainingGames.find(
    (game) => getGame(game.home, game.away, scores) === mnfEvent
  );
  const otherGames = remainingGames.filter((game) => game !== tiebreakGame);

  // The MNF total only varies while that game is unfinished; afterwards (or
  // with no MNF game at all) a single total, or none, decides the tiebreak.
  const mnfTotal = mnfEvent ? getAwayScore(mnfEvent) + getHomeScore(mnfEvent) : undefined;
  const totalVaries = mnfEvent !== undefined && !mnfEvent.status.type.completed;
  const projections = Object.values(playersProjectedMNFPoints).filter(
    (points): points is number => typeof points === "number"
  );
  const minTotal = mnfTotal ?? 0;
  const maxTotal = totalVaries ? Math.max(minTotal, ...projections) + 1 : minTotal;

  const tiebreakResults: (RickTeamCode | null)[] = tiebreakGame
    ? [tiebreakGame.away, tiebreakGame.home]
    : [null];
  const otherOutcomes = getOutcomes(otherGames);

  const getRoundWinners = (outcome: RickTeamCode[], total: number): Player[] => {
    const outcomeGames = tiebreakGame ? [...otherGames, tiebreakGame] : otherGames;
    const roundScores = baseScores.map(([player, score]) => {
      const gained = outcomeGames.filter((game, i) => {
        const pick = game.picks.find((p) => p.player === player)?.pick;
        return pick !== undefined && pick !== LATE_PICK && pick === outcome[i];
      }).length;
      return [player, score + gained] as [Player, number];
    });
    roundScores.sort((a, b) => b[1] - a[1]);
    const topScorers = getWinners(roundScores);
    return mnfEvent
      ? getTiebreakWinnersForTotal(total, topScorers, playersProjectedMNFPoints)
      : topScorers;
  };

  const conditions = new Map<Player, WinCondition[]>();
  for (const tiebreakResult of tiebreakResults) {
    // For each player and total: which outcomes of the other games win, and
    // who they split with in each. Equal neighboring totals merge into ranges.
    const signatures = new Map<Player, string[]>();
    for (let total = minTotal; total <= maxTotal; total++) {
      const wins = new Map<Player, Record<string, Player[]>>();
      for (const otherOutcome of otherOutcomes) {
        const outcome = tiebreakResult ? [...otherOutcome, tiebreakResult] : otherOutcome;
        const winners = getRoundWinners(outcome, total);
        for (const winner of winners) {
          const byOutcome = wins.get(winner) ?? {};
          byOutcome[JSON.stringify(otherOutcome)] = winners.filter((p) => p !== winner);
          wins.set(winner, byOutcome);
        }
      }
      for (const player of PLAYERS) {
        const byOutcome = wins.get(player);
        const list = signatures.get(player) ?? [];
        list.push(byOutcome ? JSON.stringify(byOutcome) : "");
        signatures.set(player, list);
      }
    }

    for (const player of PLAYERS) {
      const list = signatures.get(player) as string[];
      let start = 0;
      for (let i = 1; i <= list.length; i++) {
        if (i < list.length && list[i] === list[start]) continue;
        if (list[start] !== "") {
          const byOutcome: Record<string, Player[]> = JSON.parse(list[start]);
          const totalRange = totalVaries
            ? formatRange(minTotal + start, minTotal + i - 1, minTotal, maxTotal)
            : undefined;

          // Outcomes of the other games that give the same split are one condition.
          const bySplit = new Map<string, RickTeamCode[][]>();
          for (const [outcomeKey, splitWith] of Object.entries(byOutcome)) {
            const key = JSON.stringify(splitWith);
            bySplit.set(key, [...(bySplit.get(key) ?? []), JSON.parse(outcomeKey)]);
          }
          for (const [splitKey, outcomes] of Array.from(bySplit.entries())) {
            for (const teams of simplifyOutcomes(otherGames, outcomes)) {
              const condition: WinCondition = {
                teams: tiebreakResult ? [...teams, tiebreakResult] : teams,
                totalRange,
                splitWith: JSON.parse(splitKey),
              };
              conditions.set(player, [...(conditions.get(player) ?? []), condition]);
            }
          }
        }
        start = i;
      }
    }
  }

  // A condition that holds whichever team wins the MNF game drops that team.
  if (tiebreakGame) {
    const sameApartFromMNF = (a: WinCondition, b: WinCondition) =>
      JSON.stringify([a.teams.slice(0, -1), a.totalRange, a.splitWith]) ===
      JSON.stringify([b.teams.slice(0, -1), b.totalRange, b.splitWith]);
    conditions.forEach((list, player) => {
      const collapsed: WinCondition[] = [];
      for (const condition of list) {
        if (condition.teams[condition.teams.length - 1] === tiebreakGame.home) continue;
        const homeMatch = list.find(
          (other) =>
            other.teams[other.teams.length - 1] === tiebreakGame.home &&
            sameApartFromMNF(condition, other)
        );
        collapsed.push(
          homeMatch ? { ...condition, teams: condition.teams.slice(0, -1) } : condition
        );
      }
      for (const condition of list) {
        if (condition.teams[condition.teams.length - 1] !== tiebreakGame.home) continue;
        const awayMatch = list.some(
          (other) =>
            other.teams[other.teams.length - 1] === tiebreakGame.away &&
            sameApartFromMNF(condition, other)
        );
        if (!awayMatch) collapsed.push(condition);
      }
      conditions.set(player, collapsed);
    });
  }

  const hasOutrightWin = (player: Player) =>
    (conditions.get(player) as WinCondition[]).some((c) => c.splitWith.length === 0);

  return Array.from(conditions.keys())
    .sort((a, b) => {
      if (hasOutrightWin(a) !== hasOutrightWin(b)) return hasOutrightWin(a) ? -1 : 1;
      return a.localeCompare(b);
    })
    .map((player) => ({
      player,
      needs: formatNeeds(conditions.get(player) as WinCondition[]),
    }));
};
