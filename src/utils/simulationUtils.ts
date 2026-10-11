import { getGame } from "./gameEventUtils";
import type { RickTeamCode } from "./constants";
import type { ESPNEvent, ESPNScoresResponse, Game } from "../types";

// The team the viewer chose to win each game, keyed by gameKey.
export type SimulatedWinners = Record<string, RickTeamCode>;

export const gameKey = (game: Game): string => game.away + "@" + game.home;

// Scores with each simulated game turned into a 1-0 final for the chosen
// team, so everything downstream treats it as a finished game.
export const applySimulatedWinners = (
  scores: ESPNScoresResponse,
  games: Game[],
  simulated: SimulatedWinners
): ESPNScoresResponse => {
  const overrides = new Map<ESPNEvent, ESPNEvent>();
  for (const game of games) {
    const winner = simulated[gameKey(game)];
    const event = winner && getGame(game.home, game.away, scores);
    if (!event || event.status.type.completed) continue;
    overrides.set(event, {
      ...event,
      simulated: true,
      status: {
        ...event.status,
        type: { description: "Final", completed: true },
      },
      competitions: [
        {
          competitors: event.competitions[0].competitors.map((team) => ({
            ...team,
            score: (team.homeAway === "home") === (winner === game.home) ? "1" : "0",
          })),
        },
      ],
    });
  }
  if (overrides.size === 0) return scores;
  return { ...scores, events: scores.events.map((event) => overrides.get(event) ?? event) };
};
