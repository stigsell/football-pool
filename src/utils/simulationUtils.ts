import { PLAYERS, LATE_PICK } from "./constants";
import type { Player } from "./constants";
import { calculateAllPlayersScores, getAwayScore, getHomeScore } from "./scoreUtils";
import { getGame, getMNFGame, getRemainingGames } from "./gameEventUtils";
import { getWinners, getTiebreakWinnersForTotal } from "./winnerUtils";
import type { ESPNEvent, ESPNScoresResponse, Game, PlayersProjectedMNFPoints } from "../types";

export const DEFAULT_SIMULATIONS = 10000;

// Typical NFL game total and spread, used to guess the final MNF total while
// that game is unfinished.
const DEFAULT_MNF_TOTAL_MEAN = 45;
const MNF_TOTAL_STD_DEV = 10;

// American moneyline ("-175", "+145", "EVEN") to the implied probability,
// which still includes the sportsbook's margin.
const moneylineToProbability = (odds: string | undefined): number | undefined => {
  if (odds === undefined) return undefined;
  const line = odds.toUpperCase() === "EVEN" ? 100 : Number(odds);
  if (!Number.isFinite(line) || line === 0) return undefined;
  return line < 0 ? -line / (-line + 100) : 100 / (line + 100);
};

/**
 * The chance the home team wins an unfinished game. In progress this is
 * ESPN's live win probability; before kickoff it is the moneyline with the
 * sportsbook's margin removed. With neither available it is 50/50.
 */
export const getHomeWinProbability = (event: ESPNEvent | undefined): number => {
  const competition = event?.competitions[0];
  const live = competition?.situation?.lastPlay?.probability;
  if (live) {
    const total = live.homeWinPercentage + live.awayWinPercentage;
    if (total > 0) return live.homeWinPercentage / total;
  }
  const moneyline = competition?.odds?.[0]?.moneyline;
  const home = moneylineToProbability(moneyline?.home?.close?.odds);
  const away = moneylineToProbability(moneyline?.away?.close?.odds);
  if (home !== undefined && away !== undefined) return home / (home + away);
  return 0.5;
};

// Standard normal sample (Box-Muller).
const randomNormal = (random: () => number): number =>
  Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());

/**
 * Plays out the rest of the week `simulations` times, using each remaining game's win probability, and returns the share of the time each
 * player wins (0–1). A split win counts as an equal share for each winner.
 * While the MNF game is unfinished its final total is drawn from a normal
 * distribution (never below the points already scored) to settle tiebreakers.
 */
export const simulateWinProbabilities = (
  games: Game[],
  scores: ESPNScoresResponse,
  playersProjectedMNFPoints: PlayersProjectedMNFPoints,
  simulations: number = DEFAULT_SIMULATIONS,
  random: () => number = Math.random
): Record<Player, number> => {
  const baseScores = calculateAllPlayersScores(games, scores);
  const remainingGames = getRemainingGames(games, scores);

  const mnfEvent = getMNFGame(scores);
  const currentTotal = mnfEvent ? getAwayScore(mnfEvent) + getHomeScore(mnfEvent) : 0;
  const totalVaries = mnfEvent !== undefined && !mnfEvent.status.type.completed;

  const mnfTotalMean = mnfEvent?.competitions[0].odds?.[0]?.overUnder ?? DEFAULT_MNF_TOTAL_MEAN;
  const homeWinProbabilities = remainingGames.map((game) =>
    getHomeWinProbability(getGame(game.home, game.away, scores))
  );

  const wins = Object.fromEntries(PLAYERS.map((player) => [player, 0])) as Record<Player, number>;

  for (let i = 0; i < simulations; i++) {
    const results = remainingGames.map((game, j) => (random() < homeWinProbabilities[j] ? game.home : game.away));
    const roundScores = baseScores.map(([player, score]) => {
      const gained = remainingGames.filter((game, j) => {
        const pick = game.picks.find((p) => p.player === player)?.pick;
        return pick !== undefined && pick !== LATE_PICK && pick === results[j];
      }).length;
      return [player, score + gained] as [Player, number];
    });
    roundScores.sort((a, b) => b[1] - a[1]);

    let winners = getWinners(roundScores);
    if (winners.length > 1 && mnfEvent) {
      const total = totalVaries
        ? Math.max(
            currentTotal,
            Math.round(mnfTotalMean + MNF_TOTAL_STD_DEV * randomNormal(random))
          )
        : currentTotal;
      winners = getTiebreakWinnersForTotal(total, winners, playersProjectedMNFPoints);
    }
    for (const winner of winners) wins[winner] += 1 / winners.length;
  }

  for (const player of PLAYERS) wins[player] /= simulations;
  return wins;
};

