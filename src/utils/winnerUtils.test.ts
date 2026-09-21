import {
  getWinners,
  getTiebreakWinners,
  getEliminatedPlayers,
} from "./winnerUtils";
import {
  mockPlayersScores,
  mockPlayersScoresTied,
  mockPlayersScoresSingleWinner,
  mockGames,
  mockScoresResponse,
  mockScoresResponseWithIncomplete,
  mockGamesLastGameLeft,
  mockScoresLastGameLeft,
} from "../__mocks__/testData";
import { ESPNEvent, ESPNScoresResponse, PlayerScoreTuple, PlayersProjectedMNFPoints } from "../types";
import { Player, RickTeamCode, PlayerPick, LATE_PICK } from "./constants";

describe("getWinners", () => {
  it("returns single winner when one player has highest score", () => {
    const winners = getWinners(mockPlayersScoresSingleWinner);
    expect(winners).toEqual(["Nick"]);
    expect(winners.length).toBe(1);
  });

  it("returns multiple winners for two-way tie", () => {
    const twoWayTie: PlayerScoreTuple[] = [
      ["Nick" as Player, 10],
      ["Adam" as Player, 10],
      ["Alex" as Player, 8],
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
    const singlePlayer: PlayerScoreTuple[] = [["Nick" as Player, 5]];
    const winners = getWinners(singlePlayer);
    expect(winners).toEqual(["Nick"]);
  });

  it("returns all players if all have same score", () => {
    const allTied: PlayerScoreTuple[] = [
      ["Nick" as Player, 7],
      ["Adam" as Player, 7],
      ["Alex" as Player, 7],
    ];
    const winners = getWinners(allTied);
    expect(winners).toEqual(["Nick", "Adam", "Alex"]);
  });
});

describe("getTiebreakWinners", () => {
  // MNF game mock with total of 51 points (27 + 24)
  const mnfGame: ESPNEvent = {
    competitions: [
      {
        competitors: [
          { homeAway: "home", score: "27" },
          { homeAway: "away", score: "24" },
        ],
      },
    ],
  } as ESPNEvent;

  it("returns player with exact MNF total match", () => {
    const projectedPoints: PlayersProjectedMNFPoints = {
      Nick: 51, // Exact match
      Adam: 45,
      Alex: 55,
    };
    const winners: Player[] = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick"]);
  });

  it("returns player closest to total when no exact match", () => {
    const projectedPoints: PlayersProjectedMNFPoints = {
      Nick: 50, // 1 away
      Adam: 45, // 6 away
      Alex: 55, // 4 away
    };
    const winners: Player[] = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick"]);
  });

  it("returns multiple players if tied after tiebreak", () => {
    const projectedPoints: PlayersProjectedMNFPoints = {
      Nick: 50, // 1 away
      Adam: 52, // 1 away (also closest)
      Alex: 55, // 4 away
    };
    const winners: Player[] = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick", "Adam"]);
  });

  it("returns all players if all equidistant from total", () => {
    const projectedPoints: PlayersProjectedMNFPoints = {
      Nick: 48, // 3 away
      Adam: 54, // 3 away
    };
    const winners: Player[] = ["Nick", "Adam"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick", "Adam"]);
  });

  it("handles single winner correctly", () => {
    const projectedPoints: PlayersProjectedMNFPoints = {
      Nick: 45,
    };
    const winners: Player[] = ["Nick"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Nick"]);
  });

  it("correctly calculates distance for over and under estimates", () => {
    const projectedPoints: PlayersProjectedMNFPoints = {
      Nick: 41, // 10 under
      Adam: 61, // 10 over
      Alex: 50, // 1 under (closest)
    };
    const winners: Player[] = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    expect(result).toEqual(["Alex"]);
  });

  it("handles high point totals", () => {
    const highScoringGame: ESPNEvent = {
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "45" },
            { homeAway: "away", score: "42" },
          ],
        },
      ],
    } as ESPNEvent;
    const projectedPoints: PlayersProjectedMNFPoints = {
      Nick: 85, // 2 away from 87
      Adam: 90, // 3 away
    };
    const winners: Player[] = ["Nick", "Adam"];
    const result = getTiebreakWinners(highScoringGame, winners, projectedPoints);
    expect(result).toEqual(["Nick"]);
  });

  it("skips players without projected points", () => {
    const projectedPoints: PlayersProjectedMNFPoints = {
      Nick: 51, // Exact match
      // Adam has no projected points
      Alex: 55,
    };
    const winners: Player[] = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    // Adam is skipped, Nick wins with exact match
    expect(result).toEqual(["Nick"]);
  });

  it("returns all winners when no one has projected points", () => {
    const projectedPoints: PlayersProjectedMNFPoints = {};
    const winners: Player[] = ["Nick", "Adam", "Alex"];
    const result = getTiebreakWinners(mnfGame, winners, projectedPoints);
    // No projected points for anyone, so return all winners
    expect(result).toEqual(["Nick", "Adam", "Alex"]);
  });
});

describe("getEliminatedPlayers", () => {
  it("returns every player who can no longer reach the high score", () => {
    // All three games are final, so anyone below the high score is eliminated.
    // Adam, Kylee and Tammy missed KC; Alex missed DET.
    expect(getEliminatedPlayers(mockGames, mockScoresResponse).sort()).toEqual([
      "Adam",
      "Alex",
      "Kylee",
      "Tammy",
    ]);
  });

  it("eliminates trailing players whose remaining picks all match the leaders", () => {
    // One game is final and two remain, so the one-game gap looks closable -
    // but Adam, Kylee and Tammy picked MIA and DET just like the leaders, so
    // neither remaining game can move them any closer.
    expect(
      getEliminatedPlayers(mockGames, mockScoresResponseWithIncomplete).sort()
    ).toEqual(["Adam", "Kylee", "Tammy"]);
  });

  it("returns nobody when games are missing", () => {
    expect(getEliminatedPlayers(undefined, mockScoresResponse)).toEqual([]);
  });

  it("returns nobody when scores are missing", () => {
    expect(getEliminatedPlayers(mockGames, undefined)).toEqual([]);
  });

  it("eliminates trailing players who share the leaders' pick in the last game", () => {
    // Leaders sit on 10, Connor/Noah/Adam on 9, one game left (RAMS @ GIA).
    // Connor and Noah picked RAMS, same as the leaders, so the game cannot
    // close the gap. Adam picked GIA and can still tie the leaders on 10.
    const eliminated = getEliminatedPlayers(
      mockGamesLastGameLeft,
      mockScoresLastGameLeft
    );

    expect(eliminated).toContain("Connor");
    expect(eliminated).toContain("Noah");
    expect(eliminated).not.toContain("Adam");
  });

  it("keeps the leaders alive when the last game is unanimous among them", () => {
    const eliminated = getEliminatedPlayers(
      mockGamesLastGameLeft,
      mockScoresLastGameLeft
    );

    ["Ben", "Nick", "Rick", "Ricky"].forEach((leader) => {
      expect(eliminated).not.toContain(leader);
    });
  });

  it("eliminates players too far back to reach the lead at all", () => {
    // Alex, Kylee, Tammy and Jake sit on 8 with one game left: even a win
    // leaves them on 9, behind the leaders' 10.
    const eliminated = getEliminatedPlayers(
      mockGamesLastGameLeft,
      mockScoresLastGameLeft
    );

    ["Alex", "Kylee", "Tammy", "Jake"].forEach((player) => {
      expect(eliminated).toContain(player);
    });
  });

  it("does not eliminate a trailing player who disagrees with every leader", () => {
    // Same standings, but Connor switches to GIA, which gives him Adam's path
    // to a tie.
    const gamesWithConnorOnGIA = mockGamesLastGameLeft.map((game, index) =>
      index === mockGamesLastGameLeft.length - 1
        ? {
            ...game,
            picks: game.picks.map((p) =>
              p.player === "Connor" ? { ...p, pick: "GIA" as RickTeamCode } : p
            ),
          }
        : game
    );

    const eliminated = getEliminatedPlayers(
      gamesWithConnorOnGIA,
      mockScoresLastGameLeft
    );

    expect(eliminated).not.toContain("Connor");
    expect(eliminated).toContain("Noah");
  });

  it("does not eliminate anyone before any game has finished", () => {
    const nothingPlayed: ESPNScoresResponse = {
      events: mockScoresLastGameLeft.events.map((event) => ({
        ...event,
        status: {
          type: { description: "Scheduled" as const, completed: false },
          period: 0,
          displayClock: "0:00",
        },
      })),
    };

    expect(getEliminatedPlayers(mockGamesLastGameLeft, nothingPlayed)).toEqual([]);
  });

  it("does not eliminate a player whose remaining pick was late", () => {
    // A late pick can never be correct, so Adam's ceiling drops to 9 while the
    // leaders stay on 10 - he is genuinely out.
    const adamPickedLate = mockGamesLastGameLeft.map((game, index) =>
      index === mockGamesLastGameLeft.length - 1
        ? {
            ...game,
            picks: game.picks.map((p) =>
              p.player === "Adam" ? { ...p, pick: LATE_PICK as PlayerPick } : p
            ),
          }
        : game
    );

    expect(
      getEliminatedPlayers(adamPickedLate, mockScoresLastGameLeft)
    ).toContain("Adam");
  });
});
