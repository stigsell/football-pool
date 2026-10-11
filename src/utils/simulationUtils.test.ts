import { getHomeWinProbability, simulateWinProbabilities } from "./simulationUtils";
import { mockEventInProgress, mockWeek4Games, mockWeek4ProjectedMNFPoints, createWeek4Scores } from "../__mocks__/testData";

describe("simulateWinProbabilities", () => {
  it("gives each player a share and the shares sum to 1", () => {
    const result = simulateWinProbabilities(
      mockWeek4Games,
      createWeek4Scores(),
      mockWeek4ProjectedMNFPoints,
      2000
    );
    const total = Object.values(result).reduce((sum, p) => sum + p, 0);
    expect(total).toBeCloseTo(1, 5);
    Object.values(result).forEach((p) => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });
});

describe("getHomeWinProbability", () => {
  const withCompetition = (extra: object) => ({
    ...mockEventInProgress,
    competitions: [{ ...mockEventInProgress.competitions[0], ...extra }],
  }) as typeof mockEventInProgress;

  it("is 50/50 with no odds or live probability", () => {
    expect(getHomeWinProbability(undefined)).toBe(0.5);
    expect(getHomeWinProbability(withCompetition({}))).toBe(0.5);
  });

  it("removes the margin from the moneyline", () => {
    const event = withCompetition({
      odds: [{ moneyline: { home: { close: { odds: "-175" } }, away: { close: { odds: "+145" } } } }],
    });
    expect(getHomeWinProbability(event)).toBeCloseTo(0.6093, 3);
  });

  it("prefers the live probability over the moneyline", () => {
    const event = withCompetition({
      situation: { lastPlay: { probability: { homeWinPercentage: 0.3975, awayWinPercentage: 0.6025 } } },
      odds: [{ moneyline: { home: { close: { odds: "-175" } }, away: { close: { odds: "+145" } } } }],
    });
    expect(getHomeWinProbability(event)).toBeCloseTo(0.3975, 4);
  });
});
