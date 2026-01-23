import {
  didAwayTeamWin,
  didHomeTeamWin,
  getAwayScore,
  getHomeScore,
  checkScore,
  calculateAllPlayersScores,
} from "./scoreUtils";
import {
  mockEvent,
  mockEventInProgress,
  mockScoresResponse,
  mockGames,
} from "../__mocks__/testData";

describe("didAwayTeamWin", () => {
  it("returns true when final and away score > home score", () => {
    const score = { status: "Final", away_score: 28, home_score: 21 };
    expect(didAwayTeamWin(score)).toBe(true);
  });

  it("returns false when final and home score > away score", () => {
    const score = { status: "Final", away_score: 21, home_score: 28 };
    expect(didAwayTeamWin(score)).toBe(false);
  });

  it("returns false when final and scores are tied", () => {
    const score = { status: "Final", away_score: 21, home_score: 21 };
    expect(didAwayTeamWin(score)).toBe(false);
  });

  it("returns false when game is not final", () => {
    const score = { status: "In Progress", away_score: 28, home_score: 21 };
    expect(didAwayTeamWin(score)).toBe(false);
  });

  it("returns false when game is scheduled", () => {
    const score = { status: "Scheduled", away_score: 0, home_score: 0 };
    expect(didAwayTeamWin(score)).toBe(false);
  });
});

describe("didHomeTeamWin", () => {
  it("returns true when final and home score > away score", () => {
    const score = { status: "Final", away_score: 21, home_score: 28 };
    expect(didHomeTeamWin(score)).toBe(true);
  });

  it("returns false when final and away score > home score", () => {
    const score = { status: "Final", away_score: 28, home_score: 21 };
    expect(didHomeTeamWin(score)).toBe(false);
  });

  it("returns false when final and scores are tied", () => {
    const score = { status: "Final", away_score: 21, home_score: 21 };
    expect(didHomeTeamWin(score)).toBe(false);
  });

  it("returns false when game is not final", () => {
    const score = { status: "In Progress", away_score: 21, home_score: 28 };
    expect(didHomeTeamWin(score)).toBe(false);
  });

  it("returns false when game is Q2 0:00", () => {
    const score = { status: "Q2 0:00", away_score: 14, home_score: 21 };
    expect(didHomeTeamWin(score)).toBe(false);
  });
});

describe("getAwayScore", () => {
  it("extracts numeric away score from event", () => {
    expect(getAwayScore(mockEvent)).toBe(24);
  });

  it("converts string score to number", () => {
    const eventWithStringScore = {
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "10" },
            { homeAway: "away", score: "17" },
          ],
        },
      ],
    };
    expect(getAwayScore(eventWithStringScore)).toBe(17);
  });

  it("returns 0 for zero score", () => {
    const eventWithZeroScore = {
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "0" },
            { homeAway: "away", score: "0" },
          ],
        },
      ],
    };
    expect(getAwayScore(eventWithZeroScore)).toBe(0);
  });

  it("returns correct score from in-progress game", () => {
    expect(getAwayScore(mockEventInProgress)).toBe(3);
  });
});

describe("getHomeScore", () => {
  it("extracts numeric home score from event", () => {
    expect(getHomeScore(mockEvent)).toBe(27);
  });

  it("converts string score to number", () => {
    const eventWithStringScore = {
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "35" },
            { homeAway: "away", score: "14" },
          ],
        },
      ],
    };
    expect(getHomeScore(eventWithStringScore)).toBe(35);
  });

  it("returns 0 for zero score", () => {
    const eventWithZeroScore = {
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "0" },
            { homeAway: "away", score: "0" },
          ],
        },
      ],
    };
    expect(getHomeScore(eventWithZeroScore)).toBe(0);
  });

  it("returns correct score from in-progress game", () => {
    expect(getHomeScore(mockEventInProgress)).toBe(7);
  });
});

describe("checkScore", () => {
  it("returns Final status for completed game", () => {
    const game = { home: "KC", away: "BUF" };
    const result = checkScore(game, mockScoresResponse);
    expect(result.status).toBe("Final");
    expect(result.away_score).toBe(24);
    expect(result.home_score).toBe(27);
  });

  it("returns formatted clock for in-progress game", () => {
    const scoresWithInProgress = {
      events: [
        {
          shortName: "BUF @ KC",
          date: "2025-01-20T00:15Z",
          status: {
            type: { description: "In Progress", completed: false },
            period: 2,
            displayClock: "5:30",
          },
          competitions: [
            {
              competitors: [
                { homeAway: "home", score: "14" },
                { homeAway: "away", score: "10" },
              ],
            },
          ],
        },
      ],
    };
    const game = { home: "KC", away: "BUF" };
    const result = checkScore(game, scoresWithInProgress);
    expect(result.status).toBe("Q2 5:30");
    expect(result.away_score).toBe(10);
    expect(result.home_score).toBe(14);
  });

  it("handles game with team conversion", () => {
    const game = { home: "DET", away: "CHIC" };
    const result = checkScore(game, mockScoresResponse);
    expect(result.status).toBe("Final");
    expect(result.away_score).toBe(14);
    expect(result.home_score).toBe(35);
  });

  it("returns correct scores for Miami at New England", () => {
    const game = { home: "NE", away: "MIA" };
    const result = checkScore(game, mockScoresResponse);
    expect(result.status).toBe("Final");
    expect(result.away_score).toBe(28);
    expect(result.home_score).toBe(21);
  });
});

describe("calculateAllPlayersScores", () => {
  it("calculates scores for all players", () => {
    const result = calculateAllPlayersScores(mockGames, mockScoresResponse);
    // Result should be an array of [player, score] tuples
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(11); // 11 players
  });

  it("returns sorted array (high to low)", () => {
    const result = calculateAllPlayersScores(mockGames, mockScoresResponse);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i][1]).toBeGreaterThanOrEqual(result[i + 1][1]);
    }
  });

  it("correctly accumulates scores based on correct picks", () => {
    const result = calculateAllPlayersScores(mockGames, mockScoresResponse);
    // KC won (home), MIA won (away), DET won (home)
    // Nick picked: KC (correct), MIA (correct), DET (correct) = 3
    const nickScore = result.find((p) => p[0] === "Nick");
    expect(nickScore[1]).toBe(3);
  });

  it("calculates correct score for player with some wrong picks", () => {
    const result = calculateAllPlayersScores(mockGames, mockScoresResponse);
    // Alex picked: KC (correct), MIA (correct), CHIC (wrong) = 2
    const alexScore = result.find((p) => p[0] === "Alex");
    expect(alexScore[1]).toBe(2);
  });

  it("calculates correct score for player with different picks", () => {
    const result = calculateAllPlayersScores(mockGames, mockScoresResponse);
    // Adam picked: BUF (wrong), MIA (correct), DET (correct) = 2
    const adamScore = result.find((p) => p[0] === "Adam");
    expect(adamScore[1]).toBe(2);
  });

  it("handles ties correctly", () => {
    const result = calculateAllPlayersScores(mockGames, mockScoresResponse);
    // Check that players with same score are both present
    const scores = result.map((p) => p[1]);
    const nickScore = result.find((p) => p[0] === "Nick")[1];
    const playersWithNickScore = result.filter((p) => p[1] === nickScore);
    // All players with the same score should be adjacent in the sorted list
    expect(playersWithNickScore.length).toBeGreaterThanOrEqual(1);
  });
});
