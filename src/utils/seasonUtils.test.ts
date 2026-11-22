import {
  getSeasonTotals,
  getWeekWinners,
  getLatePickTotals,
  getSeasonEarnings,
  getBestWeeks,
  getMostAlikePairs,
  countSamePicks,
  pairKey,
  getWorstWeeks,
  getLiveWeekResult,
  countLatePicks,
  withLiveWeek,
} from "./seasonUtils";
import { LATE_PICK, PLAYERS } from "./constants";
import {
  mockGames,
  mockScoresResponse,
  mockScoresResponseWithIncomplete,
} from "../__mocks__/testData";
import type { Game, SeasonWeekResult } from "../types";

describe("getSeasonTotals", () => {
  it("adds each player's correct picks across every week", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: { Nick: 10, Adam: 9 } },
      { week: 2, correctPicks: { Nick: 8, Adam: 11 } },
    ];

    const totals = Object.fromEntries(getSeasonTotals(weeks));
    expect(totals.Nick).toBe(18);
    expect(totals.Adam).toBe(20);
  });

  it("sorts from most correct picks to fewest", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: { Nick: 10, Adam: 9, Ben: 12 } },
    ];

    const order = getSeasonTotals(weeks).map(([player]) => player);
    expect(order.slice(0, 3)).toEqual(["Ben", "Nick", "Adam"]);
  });

  it("breaks ties alphabetically", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: { Nick: 10, Adam: 10, Ben: 10 } },
    ];

    const order = getSeasonTotals(weeks).map(([player]) => player);
    expect(order.slice(0, 3)).toEqual(["Adam", "Ben", "Nick"]);
  });

  it("counts a player with no recorded picks as zero", () => {
    const weeks: SeasonWeekResult[] = [{ week: 1, correctPicks: { Nick: 10 } }];

    const totals = Object.fromEntries(getSeasonTotals(weeks));
    expect(totals.Jake).toBe(0);
  });

  it("includes every player even with no weeks recorded", () => {
    const totals = getSeasonTotals([]);
    expect(totals.length).toBe(PLAYERS.length);
    expect(totals.every(([, total]) => total === 0)).toBe(true);
  });
});

describe("getLiveWeekResult", () => {
  it("scores the week in progress from the live results", () => {
    const live = getLiveWeekResult(2, mockGames, mockScoresResponse);

    expect(live?.week).toBe(2);
    // Adam, Kylee and Tammy missed KC; Alex missed DET.
    expect(live?.correctPicks.Nick).toBe(3);
    expect(live?.correctPicks.Adam).toBe(2);
    expect(live?.correctPicks.Alex).toBe(2);
  });

  it("counts only the games finished so far", () => {
    const live = getLiveWeekResult(2, mockGames, mockScoresResponseWithIncomplete);

    // Only KC @ BUF is final at this point.
    expect(live?.correctPicks.Nick).toBe(1);
    expect(live?.correctPicks.Adam).toBe(0);
  });

  it("returns nothing without a week, games or scores", () => {
    expect(getLiveWeekResult(undefined, mockGames, mockScoresResponse)).toBeUndefined();
    expect(getLiveWeekResult(2, undefined, mockScoresResponse)).toBeUndefined();
    expect(getLiveWeekResult(2, mockGames, undefined)).toBeUndefined();
    expect(getLiveWeekResult(2, [], mockScoresResponse)).toBeUndefined();
  });
});

describe("withLiveWeek", () => {
  const recorded: SeasonWeekResult[] = [
    { week: 1, correctPicks: { Nick: 10 } },
  ];

  it("appends the week in progress", () => {
    const live: SeasonWeekResult = { week: 2, correctPicks: { Nick: 6 } };
    expect(withLiveWeek(recorded, live)).toEqual([...recorded, live]);
  });

  it("leaves the recorded weeks alone when there is no live week", () => {
    expect(withLiveWeek(recorded, undefined)).toEqual(recorded);
  });

  it("does not double count a week already recorded in the season data", () => {
    // Once week 1 lands in the json file its live scores are ignored.
    const live: SeasonWeekResult = { week: 1, correctPicks: { Nick: 4 } };
    expect(withLiveWeek(recorded, live)).toEqual(recorded);
  });
});

describe("getWeekWinners", () => {
  it("lists each recorded week with its winner in playing order", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 2, correctPicks: { Nick: 11 }, winners: ["Nick"] },
      { week: 1, correctPicks: { Noah: 12 }, winners: ["Noah"] },
    ];

    expect(getWeekWinners(weeks)).toEqual([
      { week: 1, winner: "Noah" },
      { week: 2, winner: "Nick" },
    ]);
  });

  it("shares a week the tiebreaker could not separate", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: { Nick: 11, Ben: 11 }, winners: ["Ben", "Nick"] },
    ];

    expect(getWeekWinners(weeks)).toEqual([{ week: 1, winner: "Ben, Nick" }]);
  });

  it("leaves out a week with no winner decided yet", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: { Noah: 12 }, winners: ["Noah"] },
      { week: 2, correctPicks: { Nick: 6 } },
      { week: 3, correctPicks: { Nick: 2 }, winners: [] },
    ];

    expect(getWeekWinners(weeks)).toEqual([{ week: 1, winner: "Noah" }]);
  });

  it("returns nothing for a season with no recorded weeks", () => {
    expect(getWeekWinners([])).toEqual([]);
  });
});

describe("countLatePicks", () => {
  const game = (picks: Game["picks"]): Game => ({ home: "KC", away: "BUF", picks });

  it("counts each player's picks that missed the deadline", () => {
    const games: Game[] = [
      game([
        { player: "Nick", pick: LATE_PICK },
        { player: "Adam", pick: "KC" },
      ]),
      game([
        { player: "Nick", pick: LATE_PICK },
        { player: "Adam", pick: LATE_PICK },
      ]),
    ];

    expect(countLatePicks(games)).toEqual({ Nick: 2, Adam: 1 });
  });

  it("leaves out players who were never late", () => {
    const games: Game[] = [game([{ player: "Nick", pick: "KC" }])];
    expect(countLatePicks(games)).toEqual({});
  });

  it("counts nothing for a week with no games", () => {
    expect(countLatePicks([])).toEqual({});
  });
});

describe("getLatePickTotals", () => {
  it("adds each player's late picks across every week", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {}, latePicks: { Nick: 1, Adam: 2 } },
      { week: 2, correctPicks: {}, latePicks: { Nick: 3 } },
    ];

    const totals = Object.fromEntries(getLatePickTotals(weeks));
    expect(totals.Nick).toBe(4);
    expect(totals.Adam).toBe(2);
  });

  it("sorts from most late picks to fewest", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {}, latePicks: { Nick: 1, Adam: 3, Ben: 2 } },
    ];

    expect(getLatePickTotals(weeks).slice(0, 3)).toEqual([
      ["Adam", 3],
      ["Ben", 2],
      ["Nick", 1],
    ]);
  });

  it("breaks ties alphabetically", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {}, latePicks: { Nick: 2, Ben: 2 } },
    ];

    expect(getLatePickTotals(weeks).slice(0, 2)).toEqual([
      ["Ben", 2],
      ["Nick", 2],
    ]);
  });

  it("counts a week recorded without late picks as zero", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: { Nick: 10 } },
      { week: 2, correctPicks: { Nick: 9 }, latePicks: { Nick: 1 } },
    ];

    expect(Object.fromEntries(getLatePickTotals(weeks)).Nick).toBe(1);
  });

  it("includes every player even with no weeks recorded", () => {
    expect(getLatePickTotals([])).toHaveLength(PLAYERS.length);
  });
});

describe("getSeasonEarnings", () => {
  const earningsFor = (weeks: SeasonWeekResult[]) =>
    Object.fromEntries(
      getSeasonEarnings(weeks).map(({ player, winnings, net }) => [
        player,
        { winnings, net },
      ])
    );

  it("pays a week's winner the full $110 and nets out the $180 buy-in", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {}, winners: ["Nick"] },
      { week: 2, correctPicks: {}, winners: ["Nick"] },
    ];

    const earnings = earningsFor(weeks);
    expect(earnings.Nick).toEqual({ winnings: 220, net: 40 });
    expect(earnings.Adam).toEqual({ winnings: 0, net: -180 });
  });

  it("splits a tied week evenly", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {}, winners: ["Ben", "Tammy"] },
      { week: 2, correctPicks: {}, winners: ["Adam", "Connor", "Noah"] },
    ];

    const earnings = earningsFor(weeks);
    expect(earnings.Ben.winnings).toBe(55);
    expect(earnings.Adam.winnings).toBeCloseTo(110 / 3);
  });

  it("pays nothing for a week with no winner yet", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: { Nick: 9 } },
      { week: 2, correctPicks: {}, winners: [] },
    ];

    expect(getSeasonEarnings(weeks).every(({ winnings }) => winnings === 0)).toBe(true);
  });

  it("sorts biggest winner first and breaks ties alphabetically", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {}, winners: ["Noah"] },
      { week: 2, correctPicks: {}, winners: ["Ben"] },
      { week: 3, correctPicks: {}, winners: ["Noah"] },
    ];

    const order = getSeasonEarnings(weeks).map(({ player }) => player);
    expect(order.slice(0, 3)).toEqual(["Noah", "Ben", "Adam"]);
  });
});

describe("getBestWeeks and getWorstWeeks", () => {
  const weeks: SeasonWeekResult[] = [
    { week: 2, correctPicks: { Nick: 6, Adam: 9, Ben: 12 } },
    { week: 1, correctPicks: { Nick: 10, Adam: 3, Ben: 8 } },
  ];

  it("finds the most correct picks by one player in a week", () => {
    expect(getBestWeeks(weeks)).toEqual([{ week: 2, correct: 12, players: ["Ben"] }]);
  });

  it("finds the fewest correct picks by one player in a week", () => {
    expect(getWorstWeeks(weeks)).toEqual([{ week: 1, correct: 3, players: ["Adam"] }]);
  });

  it("groups players who share the record in a week", () => {
    const tied: SeasonWeekResult[] = [
      { week: 1, correctPicks: { Nick: 12, Adam: 12, Ben: 8 } },
    ];

    expect(getBestWeeks(tied)).toEqual([
      { week: 1, correct: 12, players: ["Adam", "Nick"] },
    ]);
  });

  it("lists each week that matches the record, in playing order", () => {
    const tied: SeasonWeekResult[] = [
      { week: 3, correctPicks: { Nick: 5, Adam: 9 } },
      { week: 1, correctPicks: { Ben: 5, Adam: 9 } },
      { week: 2, correctPicks: { Nick: 7 } },
    ];

    expect(getWorstWeeks(tied)).toEqual([
      { week: 1, correct: 5, players: ["Ben"] },
      { week: 3, correct: 5, players: ["Nick"] },
    ]);
  });

  it("ignores players with no score for a week", () => {
    const partial: SeasonWeekResult[] = [{ week: 1, correctPicks: { Nick: 7 } }];

    expect(getWorstWeeks(partial)).toEqual([{ week: 1, correct: 7, players: ["Nick"] }]);
  });

  it("returns nothing when no scores are recorded", () => {
    expect(getBestWeeks([])).toEqual([]);
    expect(getWorstWeeks([{ week: 1, correctPicks: {} }])).toEqual([]);
  });
});

describe("pairKey", () => {
  it("gives a pair the same key whichever player comes first", () => {
    expect(pairKey("Adam", "Nick")).toBe("Adam|Nick");
    expect(pairKey("Nick", "Adam")).toBe("Adam|Nick");
  });
});

describe("countSamePicks", () => {
  const game = (picks: Game["picks"]): Game => ({ home: "KC", away: "BUF", picks });

  it("counts the games each pair picked the same team in", () => {
    const games: Game[] = [
      game([
        { player: "Nick", pick: "KC" },
        { player: "Adam", pick: "KC" },
        { player: "Ben", pick: "BUF" },
      ]),
      game([
        { player: "Nick", pick: "BUF" },
        { player: "Adam", pick: "BUF" },
        { player: "Ben", pick: "BUF" },
      ]),
    ];

    expect(countSamePicks(games)).toEqual({
      "Adam|Nick": 2,
      "Adam|Ben": 1,
      "Ben|Nick": 1,
    });
  });

  it("never counts a late pick as agreeing", () => {
    const games: Game[] = [
      game([
        { player: "Nick", pick: LATE_PICK },
        { player: "Adam", pick: LATE_PICK },
        { player: "Ben", pick: "KC" },
      ]),
    ];

    expect(countSamePicks(games)).toEqual({});
  });

  it("returns nothing for no games", () => {
    expect(countSamePicks([])).toEqual({});
  });
});

describe("getMostAlikePairs", () => {
  it("finds the pair that picked the same most across every week", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {}, samePicks: { "Adam|Nick": 5, "Adam|Ben": 7 } },
      { week: 2, correctPicks: {}, samePicks: { "Adam|Nick": 4, "Adam|Ben": 1 } },
    ];

    expect(getMostAlikePairs(weeks)).toEqual([
      { players: ["Adam", "Nick"], count: 9 },
    ]);
  });

  it("returns every pair level at the top, in player order", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {}, samePicks: { "Ben|Nick": 6, "Adam|Alex": 6, "Adam|Ben": 2 } },
    ];

    expect(getMostAlikePairs(weeks)).toEqual([
      { players: ["Adam", "Alex"], count: 6 },
      { players: ["Ben", "Nick"], count: 6 },
    ]);
  });

  it("skips a week recorded without same picks", () => {
    const weeks: SeasonWeekResult[] = [
      { week: 1, correctPicks: {} },
      { week: 2, correctPicks: {}, samePicks: { "Adam|Nick": 3 } },
    ];

    expect(getMostAlikePairs(weeks)).toEqual([{ players: ["Adam", "Nick"], count: 3 }]);
  });

  it("returns nothing when no pair has agreed", () => {
    expect(getMostAlikePairs([])).toEqual([]);
    expect(getMostAlikePairs([{ week: 1, correctPicks: {}, samePicks: {} }])).toEqual([]);
  });
});

describe("getLiveWeekResult same picks", () => {
  it("includes how often each pair picked the same team", () => {
    const live = getLiveWeekResult(12, mockGames, mockScoresResponse);

    expect(live?.samePicks).toEqual(countSamePicks(mockGames));
  });
});
