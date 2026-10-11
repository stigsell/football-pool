import { applySimulatedWinners, gameKey } from "./simulationUtils";
import { checkScore, didAwayTeamWin, didHomeTeamWin } from "./scoreUtils";
import { mockEventScheduled } from "../__mocks__/testData";
import type { Game } from "../types";

const game: Game = { home: "LV", away: "DEN", picks: [] };
const scores = { events: [mockEventScheduled] };

describe("applySimulatedWinners", () => {
  it("returns the same scores when nothing is simulated", () => {
    expect(applySimulatedWinners(scores, [game], {})).toBe(scores);
  });

  it("makes the chosen home team a final winner", () => {
    const result = applySimulatedWinners(scores, [game], { [gameKey(game)]: "LV" });
    const score = checkScore(game, result)!;
    expect(didHomeTeamWin(score)).toBe(true);
  });

  it("makes the chosen away team a final winner without touching the input", () => {
    const result = applySimulatedWinners(scores, [game], { [gameKey(game)]: "DEN" });
    expect(didAwayTeamWin(checkScore(game, result)!)).toBe(true);
    expect(mockEventScheduled.status.type.completed).toBe(false);
  });
});

describe("simulated events", () => {
  it("are flagged so the MNF total is not treated as real", () => {
    const result = applySimulatedWinners(scores, [game], { [gameKey(game)]: "LV" });
    expect(result.events[0].simulated).toBe(true);
  });
});
