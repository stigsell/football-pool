import {
  getSeasonTotals,
  getWeekWinners,
  getLatePickTotals,
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

    expect(getWeekWinners(weeks)).toEqual([{ week: 1, winner: "Ben & Nick" }]);
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
