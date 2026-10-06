import {
  getWinScenarios,
  getClinchedWinners,
  getEliminatedPlayersWithTiebreak,
} from "./scenarioUtils";
import {
  mockWeek4Games,
  mockWeek4ProjectedMNFPoints,
  createWeek4Scores,
} from "../__mocks__/testData";
import type { Game } from "../types";
import { LATE_PICK } from "./constants";

// Each need as it reads on the page, e.g. "NO wins (split with Rick)".
const getWinScenarioText = (...args: Parameters<typeof getWinScenarios>) =>
  getWinScenarios(...args).map(({ player, needs }) => ({
    player,
    needs: needs.map(({ condition, result }) => condition + " (" + result + ")"),
  }));

describe("getWinScenarios", () => {
  it("keeps each condition apart from what it gets the player", () => {
    const [nick] = getWinScenarios(
      mockWeek4Games,
      createWeek4Scores(),
      mockWeek4ProjectedMNFPoints
    );
    expect(nick.needs).toEqual([
      { condition: "ATL wins and total points are 41–43", result: "win outright" },
    ]);
  });

  it("lists what each contender needs with only the MNF game left", () => {
    const scenarios = getWinScenarioText(
      mockWeek4Games,
      createWeek4Scores(),
      mockWeek4ProjectedMNFPoints
    );
    expect(scenarios).toEqual([
      {
        player: "Nick",
        needs: ["ATL wins and total points are 41–43 (win outright)"],
      },
      {
        player: "Ben",
        needs: [
          "ATL wins and total points are ≤ 40 (split with Rick)",
          "NO wins and total points are ≤ 41 (split with Rick)",
          "NO wins and total points are exactly 42 (split with Rick, Noah, and Jake)",
        ],
      },
      {
        player: "Jake",
        needs: [
          "ATL wins and total points are ≥ 44 (split with Noah)",
          "NO wins and total points are ≥ 43 (split with Noah)",
          "NO wins and total points are exactly 42 (split with Ben, Rick, and Noah)",
        ],
      },
      {
        player: "Noah",
        needs: [
          "ATL wins and total points are ≥ 44 (split with Jake)",
          "NO wins and total points are ≥ 43 (split with Jake)",
          "NO wins and total points are exactly 42 (split with Ben, Rick, and Jake)",
        ],
      },
      {
        player: "Rick",
        needs: [
          "ATL wins and total points are ≤ 40 (split with Ben)",
          "NO wins and total points are ≤ 41 (split with Ben)",
          "NO wins and total points are exactly 42 (split with Ben, Noah, and Jake)",
        ],
      },
    ]);
  });

  it("names the other game only for players whose win depends on it", () => {
    const scenarios = getWinScenarioText(
      mockWeek4Games,
      createWeek4Scores({
        "DET @ CAR": { description: "Scheduled" },
        "ATL @ NO": { description: "Scheduled" },
      }),
      mockWeek4ProjectedMNFPoints
    );
    const needsOf = (player: string) =>
      scenarios.find((s) => s.player === player)?.needs;

    // Everyone but Ben picked DET, so Nick gains level with the leaders either way.
    expect(needsOf("Nick")).toEqual(["ATL wins and total points are 41–43 (win outright)"]);
    // Ben was the lone CAR pick, and needs it to stay in it.
    expect(needsOf("Ben")).toEqual([
      "CAR wins, ATL wins, and total points are ≤ 40 (split with Rick)",
      "CAR wins, NO wins, and total points are ≤ 41 (split with Rick)",
      "CAR wins, NO wins, and total points are exactly 42 (split with Rick, Noah, and Jake)",
    ]);
    // Without Ben level with him, Rick wins outright when DET wins.
    expect(needsOf("Rick")).toEqual(
      expect.arrayContaining([
        "DET wins, ATL wins, and total points are ≤ 40 (win outright)",
        "DET wins, NO wins, and total points are ≤ 41 (win outright)",
      ])
    );
  });

  it("starts the ranges at the points already scored in MNF", () => {
    // 44 points already: Ben, Rick and Nick's totals are out of reach, and
    // Noah and Jake win together whatever happens.
    const scenarios = getWinScenarioText(
      mockWeek4Games,
      createWeek4Scores({ "ATL @ NO": { description: "In Progress", away: 20, home: 24 } }),
      mockWeek4ProjectedMNFPoints
    );
    expect(scenarios).toEqual([
      { player: "Jake", needs: ["Clinched (split with Noah)"] },
      { player: "Noah", needs: ["Clinched (split with Jake)"] },
    ]);
  });

  it("leaves out total points once the MNF game is final", () => {
    // MNF ended ATL 21-19, so 40 points, with DET @ CAR still to finish.
    const scenarios = getWinScenarioText(
      mockWeek4Games,
      createWeek4Scores({
        "DET @ CAR": { description: "Scheduled" },
        "ATL @ NO": { description: "Final", away: 21, home: 19 },
      }),
      mockWeek4ProjectedMNFPoints
    );
    expect(scenarios).toEqual([
      { player: "Rick", needs: ["DET wins (win outright)", "CAR wins (split with Ben)"] },
      { player: "Ben", needs: ["CAR wins (split with Rick)"] },
    ]);
  });

  it("handles two non-MNF games left after MNF is final", () => {
    // MNF ended ATL 21-19 (40 points); KC @ LV and DET @ CAR are unfinished.
    const scenarios = getWinScenarioText(
      mockWeek4Games,
      createWeek4Scores({
        "KC @ LV": { description: "Scheduled" },
        "DET @ CAR": { description: "Scheduled" },
        "ATL @ NO": { description: "Final", away: 21, home: 19 },
      }),
      mockWeek4ProjectedMNFPoints
    );
    // Rick was the lone LV pick and Ben the lone CAR pick.
    expect(scenarios).toEqual([
      {
        player: "Rick",
        needs: [
          "KC wins and DET wins (win outright)",
          "LV wins and DET wins (win outright)",
          "LV wins and CAR wins (win outright)",
          "KC wins and CAR wins (split with Ben)",
        ],
      },
      { player: "Ben", needs: ["KC wins and CAR wins (split with Rick)"] },
    ]);
  });

  it("splits between every tied player when nobody has a projection", () => {
    const scenarios = getWinScenarioText(mockWeek4Games, createWeek4Scores(), {});
    // An ATL win brings Nick level, so all five split; NO leaves him a game short.
    expect(scenarios).toEqual([
      {
        player: "Ben",
        needs: ["ATL wins (split with Rick, Noah, Jake, and Nick)", "NO wins (split with Rick, Noah, and Jake)"],
      },
      {
        player: "Jake",
        needs: ["ATL wins (split with Ben, Rick, Noah, and Nick)", "NO wins (split with Ben, Rick, and Noah)"],
      },
      { player: "Nick", needs: ["ATL wins (split with Ben, Rick, Noah, and Jake)"] },
      {
        player: "Noah",
        needs: ["ATL wins (split with Ben, Rick, Jake, and Nick)", "NO wins (split with Ben, Rick, and Jake)"],
      },
      {
        player: "Rick",
        needs: ["ATL wins (split with Ben, Noah, Jake, and Nick)", "NO wins (split with Ben, Noah, and Jake)"],
      },
    ]);
  });

  it("never credits a late pick", () => {
    // Nick's ATL pick on Monday night came in late, so he cannot catch up.
    const games: Game[] = mockWeek4Games.map((game) =>
      game.home !== "NO"
        ? game
        : {
            ...game,
            picks: game.picks.map((pick) =>
              pick.player === "Nick" ? { ...pick, pick: LATE_PICK } : pick
            ),
          }
    );
    const scenarios = getWinScenarioText(games, createWeek4Scores(), mockWeek4ProjectedMNFPoints);
    expect(scenarios.map((s) => s.player)).not.toContain("Nick");
  });

  it("lets every tied player win when there are no games at all", () => {
    const scenarios = getWinScenarioText([], { events: [] }, mockWeek4ProjectedMNFPoints);
    expect(scenarios).toHaveLength(11);
    expect(scenarios[0].needs).toEqual([
      "Clinched (split with Alex, Ben, Kylee, Nick, Rick, Ricky, Tammy, Connor, Noah, and Jake)",
    ]);
  });
});

describe("getEliminatedPlayersWithTiebreak", () => {
  it("eliminates everyone with no winning scenario left", () => {
    const eliminated = getEliminatedPlayersWithTiebreak(
      mockWeek4Games,
      createWeek4Scores({ "ATL @ NO": { description: "In Progress", away: 20, home: 24 } }),
      mockWeek4ProjectedMNFPoints
    );
    expect(eliminated).toEqual([
      "Adam", "Alex", "Ben", "Kylee", "Nick", "Rick", "Ricky", "Tammy", "Connor",
    ]);
  });

  it("compares correct picks alone when more than four games are left", () => {
    const unfinished = ["KC @ LV", "DEN @ SF", "LAC @ SEA", "DET @ CAR", "ATL @ NO"];
    const eliminated = getEliminatedPlayersWithTiebreak(
      mockWeek4Games,
      createWeek4Scores(
        Object.fromEntries(unfinished.map((name) => [name, { description: "Scheduled" as const }]))
      ),
      mockWeek4ProjectedMNFPoints
    );
    // Picks alone: Ben, Rick and Nick stay alive, though the tiebreaker may
    // rule them out later.
    expect(eliminated.sort()).toEqual(["Adam", "Connor", "Kylee", "Ricky", "Tammy"]);
  });

  it("eliminates nobody before games and scores are loaded", () => {
    expect(getEliminatedPlayersWithTiebreak(undefined, undefined, {})).toEqual([]);
  });
});

describe("getClinchedWinners", () => {
  const mnfAt44 = () =>
    createWeek4Scores({ "ATL @ NO": { description: "In Progress", away: 20, home: 24 } });

  it("names the winners before MNF ends once the tiebreaker is settled", () => {
    expect(
      getClinchedWinners(mockWeek4Games, mnfAt44(), mockWeek4ProjectedMNFPoints)
    ).toEqual(["Jake", "Noah"]);
    expect(
      getWinScenarios(mockWeek4Games, mnfAt44(), mockWeek4ProjectedMNFPoints).map(
        (s) => s.clinched
      )
    ).toEqual([true, true]);
  });

  it("names the tiebreak winner once every game is final", () => {
    const scores = createWeek4Scores({
      "ATL @ NO": { description: "Final", away: 21, home: 20 },
    });
    expect(getClinchedWinners(mockWeek4Games, scores, mockWeek4ProjectedMNFPoints)).toEqual([
      "Nick",
    ]);
  });

  it("is empty while the result is still open", () => {
    expect(
      getClinchedWinners(mockWeek4Games, createWeek4Scores(), mockWeek4ProjectedMNFPoints)
    ).toEqual([]);
  });

  it("is empty while a winner's split still depends on the result", () => {
    // MNF ended 21-19 (40 points) with DET @ CAR left: Rick always wins, but
    // splits with Ben only if CAR wins.
    const scores = createWeek4Scores({
      "DET @ CAR": { description: "Scheduled" },
      "ATL @ NO": { description: "Final", away: 21, home: 19 },
    });
    expect(getClinchedWinners(mockWeek4Games, scores, mockWeek4ProjectedMNFPoints)).toEqual([]);
  });

  it("is empty with more than four games left", () => {
    const unfinished = ["KC @ LV", "DEN @ SF", "LAC @ SEA", "DET @ CAR", "ATL @ NO"];
    const scores = createWeek4Scores(
      Object.fromEntries(unfinished.map((name) => [name, { description: "Scheduled" as const }]))
    );
    expect(getClinchedWinners(mockWeek4Games, scores, mockWeek4ProjectedMNFPoints)).toEqual([]);
  });
});
