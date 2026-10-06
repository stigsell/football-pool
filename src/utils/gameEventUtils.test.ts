import {
  isGameInProgress,
  getEventStatus,
  getAwayTeam,
  getHomeTeam,
  isGameUnanimous,
  getMNFGame,
  getGame,
} from "./gameEventUtils";
import {
  mockEvent,
  mockEventInProgress,
  mockEventEndOfPeriod,
  mockEventScheduled,
  mockScoresResponse,
} from "../__mocks__/testData";
import { ESPNScoresResponse, Pick } from "../types";
import { Player, RickTeamCode } from "./constants";

// Helper to create typed picks
const pick = (player: Player, team: RickTeamCode): Pick => ({ player, pick: team });

describe("isGameInProgress", () => {
  it("returns true for 'In Progress' status", () => {
    expect(isGameInProgress(mockEventInProgress)).toBe(true);
  });

  it("returns true for 'End of Period' status", () => {
    expect(isGameInProgress(mockEventEndOfPeriod)).toBe(true);
  });

  it("returns false for 'Final' status", () => {
    expect(isGameInProgress(mockEvent)).toBe(false);
  });

  it("returns false for 'Scheduled' status", () => {
    expect(isGameInProgress(mockEventScheduled)).toBe(false);
  });
});

describe("getEventStatus", () => {
  it("returns 'Final' for completed game", () => {
    expect(getEventStatus(mockEvent)).toBe("Final");
  });

  it("returns 'In Progress' for ongoing game", () => {
    expect(getEventStatus(mockEventInProgress)).toBe("In Progress");
  });

  it("returns 'End of Period' for halftime/between quarters", () => {
    expect(getEventStatus(mockEventEndOfPeriod)).toBe("End of Period");
  });

  it("returns 'Scheduled' for upcoming game", () => {
    expect(getEventStatus(mockEventScheduled)).toBe("Scheduled");
  });
});

describe("getAwayTeam", () => {
  it("extracts competitor with homeAway='away'", () => {
    const awayTeam = getAwayTeam(mockEvent);
    expect(awayTeam!.homeAway).toBe("away");
    expect(awayTeam!.score).toBe("24");
  });

  it("returns correct away team from in-progress game", () => {
    const awayTeam = getAwayTeam(mockEventInProgress);
    expect(awayTeam!.homeAway).toBe("away");
    expect(awayTeam!.score).toBe("3");
  });
});

describe("getHomeTeam", () => {
  it("extracts competitor with homeAway='home'", () => {
    const homeTeam = getHomeTeam(mockEvent);
    expect(homeTeam!.homeAway).toBe("home");
    expect(homeTeam!.score).toBe("27");
  });

  it("returns correct home team from in-progress game", () => {
    const homeTeam = getHomeTeam(mockEventInProgress);
    expect(homeTeam!.homeAway).toBe("home");
    expect(homeTeam!.score).toBe("7");
  });
});

describe("isGameUnanimous", () => {
  it("returns true when all picks are the same", () => {
    const unanimousPicks = [
      pick("Nick", "KC"),
      pick("Adam", "KC"),
      pick("Alex", "KC"),
    ];
    expect(isGameUnanimous(unanimousPicks)).toBe(true);
  });

  it("returns false when picks are mixed", () => {
    const mixedPicks = [
      pick("Nick", "KC"),
      pick("Adam", "BUF"),
      pick("Alex", "KC"),
    ];
    expect(isGameUnanimous(mixedPicks)).toBe(false);
  });

  it("returns true for single pick", () => {
    const singlePick = [pick("Nick", "KC")];
    expect(isGameUnanimous(singlePick)).toBe(true);
  });

  it("returns false when only one different pick", () => {
    const almostUnanimous = [
      pick("Nick", "KC"),
      pick("Adam", "KC"),
      pick("Alex", "BUF"),
    ];
    expect(isGameUnanimous(almostUnanimous)).toBe(false);
  });
});

describe("getMNFGame", () => {
  it("returns the latest game by date", () => {
    const mnfGame = getMNFGame(mockScoresResponse);
    expect(mnfGame?.shortName).toBe("BUF @ KC");
    expect(mnfGame?.date).toBe("2025-01-20T00:15Z");
  });

  it("handles multiple games with correct sorting", () => {
    const multipleGames: ESPNScoresResponse = {
      events: [
        { shortName: "Game1", date: "2025-01-19T13:00Z" } as any,
        { shortName: "Game3", date: "2025-01-21T01:00Z" } as any,
        { shortName: "Game2", date: "2025-01-20T18:00Z" } as any,
      ],
    };
    const mnfGame = getMNFGame(multipleGames);
    expect(mnfGame?.shortName).toBe("Game3");
  });

  it("returns the only game when there is just one", () => {
    const singleGame: ESPNScoresResponse = {
      events: [{ shortName: "OnlyGame", date: "2025-01-19T13:00Z" } as any],
    };
    const mnfGame = getMNFGame(singleGame);
    expect(mnfGame?.shortName).toBe("OnlyGame");
  });

  it("returns undefined for empty events array", () => {
    const emptyEvents: ESPNScoresResponse = { events: [] };
    const mnfGame = getMNFGame(emptyEvents);
    expect(mnfGame).toBeUndefined();
  });
});

describe("getGame", () => {
  it("finds game by home/away teams (Rick format)", () => {
    const game = getGame("KC", "BUF", mockScoresResponse);
    expect(game).toBeDefined();
    expect(game!.shortName).toBe("BUF @ KC");
  });

  it("returns undefined for non-existent game", () => {
    const game = getGame("SF", "DAL", mockScoresResponse);
    expect(game).toBeUndefined();
  });

  it("finds game with team conversion (CHIC -> CHI)", () => {
    const game = getGame("DET", "CHIC", mockScoresResponse);
    expect(game).toBeDefined();
    expect(game!.shortName).toBe("CHI @ DET");
  });

  it("finds game with NE team", () => {
    const game = getGame("NE", "MIA", mockScoresResponse);
    expect(game).toBeDefined();
    expect(game!.shortName).toBe("MIA @ NE");
  });

  it("returns undefined for invalid team code (tests convertRickToESPN null branch)", () => {
    // Using type assertion to test runtime behavior with invalid input
    const game = getGame("INVALID" as RickTeamCode, "BUF", mockScoresResponse);
    expect(game).toBeUndefined();
  });

  it("handles VS format in shortName", () => {
    const scoresWithVS: ESPNScoresResponse = {
      events: [
        {
          shortName: "BUF VS KC",
          date: "2025-01-20T00:15Z",
          status: {
            type: { description: "Final", completed: true },
            period: 4,
            displayClock: "0:00",
          },
          competitions: [
            {
              competitors: [
                { homeAway: "home", score: "27" },
                { homeAway: "away", score: "24" },
              ],
            },
          ],
        },
      ],
    };
    const game = getGame("KC", "BUF", scoresWithVS);
    expect(game).toBeDefined();
    expect(game!.shortName).toBe("BUF VS KC");
  });
});
