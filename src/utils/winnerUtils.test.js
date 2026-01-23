import {
  getWinners,
  getTiebreakWinners,
  isPlayerEliminated,
} from "./winnerUtils";
import {
  mockPlayersScores,
  mockPlayersScoresTied,
  mockPlayersScoresSingleWinner,
  mockPlayersProjectedMNFPoints,
} from "../__mocks__/testData";

describe("getWinners", () => {
  it("returns single winner when one player has highest score", () => {
    const winners = getWinners(mockPlayersScoresSingleWinner);
    expect(winners).toEqual(["Nick"]);
    expect(winners.length).toBe(1);
  });

  it("returns multiple winners for two-way tie", () => {
    const twoWayTie = [
      ["Nick", 10],
      ["Adam", 10],
      ["Alex", 8],
    ];
    const winners = getWinners(twoWayTie);
    expect(winners).toEqual(["Nick", "Adam"]);
    expect(winners.length).toBe(2);
  });

  it("returns all winners for three-way tie", () => {
    const winners = getWinners(mockPlayersScoresTied);
    expect(winners).toEqual(["Nick", "Adam", "Alex"]);
    expect(winners.length).toBe(3);
  });

  it("returns single winner from large player list", () => {
    const winners = getWinners(mockPlayersScores);
    expect(winners).toEqual(["Nick"]);
  });

  it("handles single player array", () => {
    const singlePlayer = [["Nick", 5]];
    const winners = getWinners(singlePlayer);
    expect(winners).toEqual(["Nick"]);
  });

  it("returns all players if all have same score", () => {
    const allTied = [
      ["Nick", 7],
      ["Adam", 7],
      ["Alex", 7],
    ];
    const winners = getWinners(allTied);
    expect(winners).toEqual(["Nick", "Adam", "Alex"]);
  });
});

describe("getTiebreakWinners", () => {
  // MNF game mock with total of 51 points (27 + 24)
  const mnfGame = {
    competitions: [
      {
        competitors: [
          { homeAway: "home", score: "27" },
          { homeAway: "away", score: "24" },
        ],
      },
    ],
  };

  it("returns player with exact MNF total match", () => {
    const projectedPoints = {
      Nick: 51, // Exact match
      Adam: 45,
      Alex: 55,
    };
    const winners = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick"]);
  });

  it("returns player closest to total when no exact match", () => {
    const projectedPoints = {
      Nick: 50, // 1 away
      Adam: 45, // 6 away
      Alex: 55, // 4 away
    };
    const winners = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick"]);
  });

  it("returns multiple players if tied after tiebreak", () => {
    const projectedPoints = {
      Nick: 50, // 1 away
      Adam: 52, // 1 away (also closest)
      Alex: 55, // 4 away
    };
    const winners = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick", "Adam"]);
  });

  it("returns all players if all equidistant from total", () => {
    const projectedPoints = {
      Nick: 48, // 3 away
      Adam: 54, // 3 away
    };
    const winners = ["Nick", "Adam"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick", "Adam"]);
  });

  it("handles single winner correctly", () => {
    const projectedPoints = {
      Nick: 45,
    };
    const winners = ["Nick"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick"]);
  });

  it("correctly calculates distance for over and under estimates", () => {
    const projectedPoints = {
      Nick: 41, // 10 under
      Adam: 61, // 10 over
      Alex: 50, // 1 under (closest)
    };
    const winners = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Alex"]);
  });

  it("handles high point totals", () => {
    const highScoringGame = {
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "45" },
            { homeAway: "away", score: "42" },
          ],
        },
      ],
    };
    const projectedPoints = {
      Nick: 85, // 2 away from 87
      Adam: 90, // 3 away
    };
    const winners = ["Nick", "Adam"];
    const result = getTiebreakWinners(highScoringGame, winners, projectedPoints);
    expect(result).toEqual(["Nick"]);
  });
});

describe("isPlayerEliminated", () => {
  it("returns true when gap is greater than remaining games (eliminated)", () => {
    expect(isPlayerEliminated(10, 5, 4)).toBe(true);
    // Gap of 5, only 4 games left - can't catch up
  });

  it("returns false when gap equals remaining games (can still tie)", () => {
    expect(isPlayerEliminated(10, 5, 5)).toBe(false);
    // Gap of 5, 5 games left - can tie with perfect picks
  });

  it("returns false when gap is less than remaining games (can win)", () => {
    expect(isPlayerEliminated(10, 8, 5)).toBe(false);
    // Gap of 2, 5 games left - can surpass leader
  });

  it("returns true when zero games remaining and gap is greater than 0", () => {
    expect(isPlayerEliminated(10, 9, 0)).toBe(true);
    // No games left, behind by 1 - eliminated
  });

  it("returns false when zero games remaining and gap is 0 (tied for lead)", () => {
    expect(isPlayerEliminated(10, 10, 0)).toBe(false);
    // No games left, tied - not eliminated (is a winner)
  });

  it("returns false when player is in the lead", () => {
    expect(isPlayerEliminated(8, 10, 3)).toBe(false);
    // Player is ahead - definitely not eliminated
  });

  it("returns true when mathematically eliminated with large gap", () => {
    expect(isPlayerEliminated(15, 5, 5)).toBe(true);
    // Gap of 10, only 5 games - impossible to catch up
  });

  it("returns false when gap is exactly 0", () => {
    expect(isPlayerEliminated(10, 10, 5)).toBe(false);
    // Tied for first place
  });

  it("handles edge case of 1 game remaining", () => {
    expect(isPlayerEliminated(10, 9, 1)).toBe(false); // Gap of 1, 1 game - can tie
    expect(isPlayerEliminated(10, 8, 1)).toBe(true); // Gap of 2, 1 game - eliminated
  });
});
